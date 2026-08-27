const mongoose = require("mongoose");

/**
 * One Mongo connection, reused for the life of the process.
 *
 * On a long-running server this ran once at boot. On Vercel the same module is
 * evaluated per cold start and then kept warm across many requests, so the
 * connection is cached on `globalThis` rather than in a module-local: a hot
 * reload in development, or a second copy of the module in a bundle, would
 * otherwise open a second pool. Atlas counts pools, not processes, and a free
 * cluster runs out of them quickly.
 *
 * The in-flight promise is cached too, so a burst of concurrent requests on a
 * cold instance all await the same connect rather than racing to open their own.
 */
const cache = globalThis.__havenMongo ?? (globalThis.__havenMongo = {
    conn: null,
    promise: null
});

/* Some local networks cannot resolve the Atlas SRV record through their own
   resolver, and pinning a public one fixes it. On Vercel the platform resolver
   is the correct one and overriding it breaks the lookup, so this is skipped
   there. Set DNS_SERVERS to override, or to an empty string to opt out.

   The `node:` prefix is not decoration. There is a package on npm called "dns"
   — an unrelated DNS server daemon — and this project once had it in its
   dependencies, presumably installed to satisfy this very line. It never did:
   a bare "dns" always resolves to Node's built-in module, which cannot be
   shadowed from node_modules. All the package ever contributed was a
   dependency tree of its own carrying 38 advisories. Spelling the import
   `node:dns` says out loud that nothing needs installing here. */
if (!process.env.VERCEL) {
    const servers = (process.env.DNS_SERVERS ?? "8.8.8.8,8.8.4.4")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    if (servers.length) {
        require("node:dns").setServers(servers);
    }
}

const connectDB = async () => {
    if (cache.conn && mongoose.connection.readyState === 1) {
        return cache.conn;
    }

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not set — the API cannot reach the database");
    }

    if (!cache.promise) {
        cache.promise = mongoose
            .connect(process.env.MONGO_URI, {
                /* Fail in ten seconds with a readable error rather than hanging
                   until the platform kills the invocation with none. */
                serverSelectionTimeoutMS: 10000,
                /* A serverless instance handles one request at a time, so a
                   large pool per instance buys nothing and costs connections. */
                maxPoolSize: 10
            })
            .then((instance) => instance.connection);
    }

    try {
        cache.conn = await cache.promise;
    } catch (err) {
        /* Never leave a rejected promise cached — the next request would get
           the same stale failure instead of retrying. */
        cache.promise = null;
        throw err;
    }

    return cache.conn;
};

module.exports = connectDB;
