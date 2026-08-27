const RateLimit = require("../models/rateLimit.model");

/**
 * An express-rate-limit store backed by MongoDB.
 *
 * The whole of a hit — "is the window still open, and if not start a new one" —
 * is done in a single update with an aggregation pipeline. That matters: two
 * requests landing on two instances in the same millisecond must not both read
 * a count of four and both write five. A pipeline update is applied atomically
 * to the document, so the second request always sees the first one's write.
 *
 * Doing it in two steps (read, then write) would have been easier to follow and
 * would have leaked a request per window boundary under concurrency. Doing it
 * in one is the difference between a limit of ten and a limit of "ten, usually".
 */
class MongoRateLimitStore {
    constructor({ prefix = "rl" } = {}) {
        this.prefix = prefix;
    }

    /** express-rate-limit hands us the window it was configured with. */
    init(options) {
        this.windowMs = options.windowMs;
    }

    key(key) {
        return `${this.prefix}:${key}`;
    }

    async increment(key) {
        const now = new Date();
        const freshExpiry = new Date(now.getTime() + this.windowMs);

        const doc = await RateLimit.findOneAndUpdate(
            { _id: this.key(key) },
            [
                {
                    $set: {
                        /* Still inside the window: carry the count on. Past it:
                           this hit is the first of a new one. A document whose
                           TTL sweep has not run yet is therefore harmless. */
                        hits: {
                            $cond: [
                                { $gt: ["$expiresAt", now] },
                                { $add: [{ $ifNull: ["$hits", 0] }, 1] },
                                1
                            ]
                        },
                        expiresAt: {
                            $cond: [{ $gt: ["$expiresAt", now] }, "$expiresAt", freshExpiry]
                        }
                    }
                }
            ],
            {
                upsert: true,
                returnDocument: "after",
                /* Mongoose 9 will not send an array as an update without being
                   told that is what it is, rather than a mistake. */
                updatePipeline: true
            }
        );

        return {
            totalHits: doc.hits,
            resetTime: doc.expiresAt
        };
    }

    /** Used by skipSuccessfulRequests / skipFailedRequests to refund a hit. */
    async decrement(key) {
        await RateLimit.updateOne(
            { _id: this.key(key), expiresAt: { $gt: new Date() }, hits: { $gt: 0 } },
            { $inc: { hits: -1 } }
        );
    }

    async resetKey(key) {
        await RateLimit.deleteOne({ _id: this.key(key) });
    }

    async get(key) {
        const doc = await RateLimit.findById(this.key(key));

        if (!doc || doc.expiresAt <= new Date()) return undefined;

        return { totalHits: doc.hits, resetTime: doc.expiresAt };
    }
}

module.exports = MongoRateLimitStore;
