const { rateLimit } = require("express-rate-limit");
const MongoRateLimitStore = require("../utils/rateLimitStore.util");
const { clientIpKey, isInternalCall } = require("../utils/clientIp.util");
const AppError = require("../utils/AppError.util");

/**
 * The rate limits.
 *
 * They are deliberately not one number applied everywhere. What a limit is for
 * differs by route: a thousand product listings an hour is a busy shopper, a
 * thousand sign-in attempts an hour is somebody working through a password
 * list, and a thousand password-reset emails an hour is a paid mailing service
 * being used to bury a stranger's inbox. So the budget follows the cost and the
 * risk of the thing being asked for, and the tightest ones sit on the routes
 * that either spend money or guess secrets.
 *
 * Every counter is shared through MongoDB — see rateLimitStore.util — because
 * per-process counting means nothing on a platform that answers a flood by
 * starting more processes.
 */

/* One escape hatch, for running the suite or hammering a form in development.
   It is opt-in and never set in a deployment, so forgetting to unset it would
   have to be done on purpose. */
const DISABLED = process.env.RATE_LIMIT_DISABLED === "true";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/**
 * Turns a tripped limit into the same JSON shape as every other refusal.
 *
 * Without this express-rate-limit sends its own plain-text body, and the client
 * — which reads `message` off a JSON error — would show "Something went wrong"
 * for a case where saying what actually happened costs nothing and tells an
 * attacker nothing they cannot already measure.
 */
const refuse = (message) => (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);

    res.set("Retry-After", String(retryAfter));

    next(new AppError(message, 429));
};

const limiter = ({ windowMs, max, message, prefix, keyGenerator, skip, skipSuccessfulRequests }) => {
    /* A disabled limiter is a pass-through rather than a missing one, so the
       route definitions read the same either way. */
    if (DISABLED) return (req, res, next) => next();

    return rateLimit({
        windowMs,
        limit: max,
        store: new MongoRateLimitStore({ prefix }),
        keyGenerator: keyGenerator ?? clientIpKey,
        skipSuccessfulRequests: Boolean(skipSuccessfulRequests),
        handler: refuse(message),

        /* The draft-standard RateLimit-* headers, so a client can back off
           before being told to. The legacy X-RateLimit-* set is off: it says
           the same thing twice. */
        standardHeaders: "draft-7",
        legacyHeaders: false,

        skip: (req, res) => {
            /* The storefront rendering its own pages is one caller making many
               requests for many people. Counting it per address would throttle
               the shop rather than any visitor of it. */
            if (isInternalCall(req)) return true;

            return skip ? skip(req, res) : false;
        },

        /* The IP is derived by clientIp.util, which deliberately does not use
           req.ip — so express-rate-limit's checks on trust-proxy settings and
           the X-Forwarded-For header are inspecting something this limiter
           never reads. They would only print advice that does not apply. */
        validate: { trustProxy: false, xForwardedForHeader: false, ip: false }
    });
};

/* ------------------------------------------------------------------ tiers */

/**
 * The blanket limit, on everything under /api.
 *
 * Generous on purpose: it is not the control that stops a targeted attack, it
 * is the one that stops a single address from making the API its own. The
 * routes worth attacking carry their own, much tighter, budget below.
 */
const globalLimiter = limiter({
    windowMs: 15 * MINUTE,
    max: 1000,
    prefix: "global",
    message: "Too many requests. Please slow down and try again shortly.",

    /* Stripe's webhook is exempt. It is not a visitor — it is one machine
       reporting payments, and refusing it means an order stays unpaid in our
       records after the shopper has been charged. It is authenticated by a
       signature on every request, which is a stronger gate than a counter, and
       Stripe's own delivery is already rate-limited at its end. */
    skip: (req) => req.path === "/api/orders/webhook"
});

/**
 * Signing in, and finishing a two-step sign-in.
 *
 * Successful requests are refunded, so this counts failures — somebody typing
 * one password wrong twice is not the target, somebody trying a hundred is.
 *
 * The two-step code deserves its own mention: it is six digits, and the account
 * layer already burns a code after five wrong guesses. That alone is not
 * enough, because asking for a fresh code resets the count; this is what makes
 * the resend limit below actually bind.
 */
const authLimiter = limiter({
    windowMs: 15 * MINUTE,
    max: 10,
    prefix: "auth",
    skipSuccessfulRequests: true,
    message: "Too many sign-in attempts. Please wait 15 minutes and try again."
});

/**
 * Anything that puts a message in somebody's inbox.
 *
 * A short cooling-off period rather than a real budget, set deliberately: an
 * hour's lockout punished the ordinary case — a code that never arrived, an
 * address typed wrong the first time — far more often than it stopped anybody.
 * Ten seconds is long enough that a script cannot hold the send button down,
 * and short enough that a person who genuinely needs another email is not sent
 * away to wait.
 *
 * Be clear about what this no longer does. At five per ten seconds a
 * determined caller can request on the order of a thousand emails an hour, so
 * this is no longer meaningful protection against burying a stranger's inbox
 * or running up the mail bill — it is a throttle, not a cap. If that matters
 * later, the fix is to keep this window and add a second, wider one over an
 * hour, so a burst is smoothed AND a day of it is still bounded.
 */
const emailLimiter = limiter({
    windowMs: 10 * SECOND,
    max: 5,
    prefix: "email",
    message: "Too many emails requested. Please wait a few seconds before asking for another."
});

/**
 * The same routes again, counted per address being written TO.
 *
 * The limiter above stops one caller emailing many people. This one stops many
 * callers emailing one person, which is the shape a bombing campaign actually
 * takes — and which a per-source limit cannot see.
 *
 * Requests with no email in them are not counted here: they fail validation in
 * the controller anyway, and giving them all one shared key would let a single
 * malformed flood exhaust the budget for everybody.
 */
const emailTargetLimiter = limiter({
    windowMs: 10 * SECOND,
    max: 4,
    prefix: "email-to",
    keyGenerator: (req) => String(req.body?.email ?? "").trim().toLowerCase(),
    skip: (req) => !req.body?.email,
    message: "Too many emails requested for that address. Please wait a few seconds."
});

/** Redeeming a reset or confirmation link. The tokens are random and hashed,
    so this is a backstop against grinding rather than the thing stopping it. */
const tokenLimiter = limiter({
    windowMs: HOUR,
    max: 20,
    prefix: "token",
    message: "Too many attempts. Please request a fresh link and try again."
});

/** Writing something other people will read. Spam control, not brute-force. */
const writeLimiter = limiter({
    windowMs: 15 * MINUTE,
    max: 40,
    prefix: "write",
    message: "You are doing that too often. Please wait a few minutes."
});

/**
 * Uploading photography.
 *
 * Keyed on the staff account rather than the address, because this route sits
 * behind `protect` and a shop's staff may well share one office connection —
 * counting them together would have one person's bulk upload lock out their
 * colleagues. Each upload writes several megabytes into MongoDB, which is what
 * the ceiling is really protecting.
 */
const uploadLimiter = limiter({
    windowMs: HOUR,
    max: 60,
    prefix: "upload",
    keyGenerator: (req) => req.user?.id ?? clientIpKey(req),
    message: "Too many uploads. Please wait a while before adding more images."
});

module.exports = {
    globalLimiter,
    authLimiter,
    emailLimiter,
    emailTargetLimiter,
    tokenLimiter,
    writeLimiter,
    uploadLimiter
};
