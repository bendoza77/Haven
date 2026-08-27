require("dotenv").config({ quiet: true });

const path = require("path");
const express = require("express");
const connectDB = require("./configs/db.config");
const userRouter = require("./routers/user.router");
const globalErrorHandler = require("./controllers/error.controller");
const cookieParser = require("cookie-parser");
const authRouter = require("./routers/auth.router");
const productRouter = require("./routers/product.router");
const accountRouter = require("./routers/account.router");
const reviewRouter = require("./routers/review.router");
const orderRouter = require("./routers/order.router");
const mediaRouter = require("./routers/media.router");
const AppError = require("./utils/AppError.util");
const catchAsync = require("./utils/catchAsync.util");
const cors = require("cors");
const passport = require("passport");
require("./configs/passport.config");

const app = express();

/* Behind Vercel's edge network every request arrives through a proxy. Without
   this, req.protocol reads "http" on an https request and req.ip is the
   proxy's, which would make a Secure cookie look wrong to Express and hide the
   caller's address from anything that logs it. */
app.set("trust proxy", true);

/**
 * Which origins may call this API with credentials.
 *
 * CLIENT_URL takes a comma-separated list so one deployment can serve the
 * production domain and a custom domain at once.
 *
 * Preview deployments are the awkward case: their hostname changes on every
 * push, so they cannot be listed. They are matched by shape instead — but only
 * under the storefront project's own name. "Any *.vercel.app" would have been
 * shorter and much worse: with credentials allowed, it would let anybody's
 * Vercel deployment make signed-in requests as a visitor of this shop and read
 * the answers. Narrowing to `haven-*.vercel.app` keeps previews working while
 * leaving every other tenant out.
 *
 * A request with no Origin header is not a browser doing a cross-site call: it
 * is a server-side render, a health check or curl. Those are allowed through,
 * because CORS is not what protects this API — the session cookie and the role
 * checks are.
 */
const allowedOrigins = (process.env.CLIENT_URL ?? "")
    .split(",")
    .map((entry) => entry.trim().replace(/\/+$/, ""))
    .filter(Boolean);

/**
 * `^https://<project>-<anything>.vercel.app$`, where <project> is taken from
 * the first CLIENT_URL that is itself a vercel.app address, or from
 * PREVIEW_URL_PREFIX when the storefront lives on a custom domain and there is
 * no name to read off it.
 */
const previewOrigin = (() => {
    if (process.env.ALLOW_VERCEL_PREVIEWS !== "true") return null;

    const explicit = process.env.PREVIEW_URL_PREFIX?.trim();

    const fromClientUrl = allowedOrigins
        .map((entry) => {
            try {
                return new URL(entry).hostname;
            } catch {
                return null;
            }
        })
        .find((host) => host?.endsWith(".vercel.app"))
        ?.replace(/\.vercel\.app$/, "");

    const project = explicit || fromClientUrl;

    if (!project) return null;

    /* The project name is interpolated into a pattern, so anything that is not
       a hostname character has to go — otherwise a dot or a plus in it would
       widen the match rather than narrow it. */
    const safe = project.replace(/[^a-z0-9-]/gi, "");

    if (!safe) return null;

    return new RegExp("^https://" + safe + "(-[a-z0-9-]+)?\\.vercel\\.app$", "i");
})();

const corsOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalised = origin.replace(/\/+$/, "");

    if (allowedOrigins.includes(normalised)) return callback(null, true);

    if (previewOrigin?.test(normalised)) return callback(null, true);

    /* Answering with "not allowed" rather than an error leaves the response a
       normal one without the CORS header, which is what the browser expects;
       throwing here would surface as an opaque 500. */
    return callback(null, false);
};

app.use(cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
}))

app.use(passport.initialize())


app.use(express.json());
app.use(cookieParser());

/**
 * Nothing below can answer without the database, so the connection is opened
 * here rather than at boot.
 *
 * On a serverless platform there is no boot to hang it off: the process starts
 * on the first request that reaches a cold instance and is reused for the ones
 * after it. connectDB caches both the connection and the in-flight promise, so
 * this costs a single await once per instance and nothing at all afterwards.
 */
app.use(catchAsync(async (req, res, next) => {
    try {
        await connectDB();
    } catch (error) {
        return next(new AppError(`The database is unreachable: ${error.message}`, 503));
    }

    next();
}));

/* Says whether the function is up and whether it can see the database — the
   first thing to check after a deployment. */
app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        data: {
            uptime: process.uptime(),
            database: "connected",
            environment: process.env.NODE_ENV ?? "unknown"
        }
    });
});

/* Uploaded photography now lives in MongoDB and is served by the media router,
   because a serverless filesystem does not survive the request that wrote to
   it. This static mount stays for images uploaded by an older build of a
   long-running server, so their URLs do not rot. crossOriginResourcePolicy is
   relaxed because the client may render them from another origin. */
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
    fallthrough: true,
    setHeaders: (res) => res.set("Cross-Origin-Resource-Policy", "cross-origin")
}));

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/account", accountRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/orders", orderRouter);
app.use("/api/media", mediaRouter);

/* An unknown path must not fall through to the error handler as a bare 500. */
app.use((req, res, next) => {
    next(new AppError(`No route matches ${req.method} ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

/* Exported rather than listened on: Vercel imports this module and drives it
   per request. `npm start` runs server.js, which is the one that binds a port. */
module.exports = app;
