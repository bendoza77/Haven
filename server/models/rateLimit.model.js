const mongoose = require("mongoose");

/**
 * One counter, for one key, for one window.
 *
 * This lives in MongoDB rather than in the process because the API runs as
 * serverless functions. An in-memory limiter counts per instance, and Vercel
 * starts as many instances as the traffic asks for — so a flood, which is
 * exactly what a limiter is for, is also exactly what spreads itself across
 * enough instances to make a per-instance count meaningless. A shared store is
 * the only kind that holds.
 *
 * `_id` is the limiter's own key ("login:203.0.113.4"), so a counter is found
 * by primary key with no secondary index to maintain.
 */
const rateLimitSchema = new mongoose.Schema(
    {
        _id: String,

        hits: {
            type: Number,
            required: true,
            default: 0
        },

        /* When this window ends. Also the TTL field: Mongo deletes the document
           once the clock passes it, so old counters cost nothing and nothing
           has to sweep them. */
        expiresAt: {
            type: Date,
            required: true
        }
    },
    { versionKey: false }
);

/* expireAfterSeconds: 0 means "expire at the time in this field". The sweep runs
   about once a minute, so a document can outlive its window briefly — the store
   compares expiresAt itself rather than trusting the row's absence. */
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);

module.exports = RateLimit;
