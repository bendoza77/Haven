/**
 * The entry point for any host that runs a long-lived process — Render,
 * Railway, Fly, a container, your own machine.
 *
 * app.js exports the Express app without binding a port, because Vercel
 * imports it and drives it per request. Everything else needs something
 * listening, and that is this file. (app.js also starts this when it is run
 * directly, so pointing a host at either one works.)
 */
require("dotenv").config({ quiet: true });

const app = require("./app");
const connectDB = require("./configs/db.config");

const port = process.env.PORT || 3001;

/* No host argument, so Node listens on every interface. Render, and every
   other platform that health-checks from outside the container, cannot see a
   server bound to 127.0.0.1 and will report the port as never opened. */
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

/**
 * Warm the database connection, but do not make startup depend on it.
 *
 * Exiting here would be the wrong trade. The port is already open, and a
 * process that binds and then kills itself looks to a host like a crash loop —
 * or, if it happens fast enough, like a service that never came up at all,
 * which is a far more confusing thing to debug than the actual problem.
 *
 * The real problem is nearly always one thing: the database is not reachable
 * from wherever this is deployed, because its IP is not on the allow-list. So
 * say that, plainly, once — and keep serving. /api/health will report the
 * failure, and the per-request gate in app.js answers 503 with the reason
 * attached, which is how you find out what is wrong instead of watching a
 * container restart.
 */
connectDB()
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => {
        console.error(`Could not reach MongoDB: ${error.message}`);
        console.error(
            "If this is a hosted deployment, the usual cause is MongoDB Atlas " +
            "refusing the connection: add this host's outbound addresses under " +
            "Atlas > Network Access. The API stays up and will answer 503 until then."
        );
    });

/* Hosts stop a service by sending SIGTERM and then waiting. Closing the server
   lets in-flight requests finish instead of being cut off mid-response. */
for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
        console.log(`${signal} received, shutting down`);
        server.close(() => process.exit(0));
    });
}
