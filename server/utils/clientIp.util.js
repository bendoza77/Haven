const crypto = require("crypto");
const { ipKeyGenerator } = require("express-rate-limit");

/**
 * Who to count a request against.
 *
 * This is the part of a rate limiter that is easy to get wrong and quiet about
 * it. Two failures are possible and this file exists to avoid both:
 *
 *   Counting the wrong person. Browser traffic reaches this API through the
 *   storefront's /api proxy, so the connection Express sees is the storefront's,
 *   not the shopper's. Key on that and every visitor in the world shares one
 *   bucket: the limiter throttles the whole shop the moment it fires, and
 *   protects nobody.
 *
 *   Counting whoever the caller says. The obvious fix is to read
 *   X-Forwarded-For, but any client can send that header. Trusting it turns the
 *   limiter off for exactly the attacker it was meant to stop, since a new
 *   value per request is a new bucket per request.
 *
 * So the shopper's address is carried in a header the storefront sets, and it
 * is believed only when the request also proves it came from the storefront —
 * a shared secret both deployments hold. Without that proof the header is
 * ignored and the connection's own address is used instead.
 */
const PROXY_SECRET = process.env.INTERNAL_PROXY_SECRET ?? "";

const CLIENT_IP_HEADER = "x-haven-client-ip";
const PROXY_SECRET_HEADER = "x-haven-proxy-secret";

/**
 * Compares in constant time.
 *
 * A plain === leaks how much of the secret was right through how long the
 * comparison took, which is enough to recover it one byte at a time. Lengths
 * are hashed first because timingSafeEqual throws on a length mismatch, and
 * throwing is itself a signal.
 */
const secretMatches = (presented) => {
    if (!PROXY_SECRET || !presented) return false;

    const a = crypto.createHash("sha256").update(String(presented)).digest();
    const b = crypto.createHash("sha256").update(PROXY_SECRET).digest();

    return crypto.timingSafeEqual(a, b);
};

/** Whether this request carries proof that the storefront made it. */
const fromTrustedProxy = (req) => secretMatches(req.get(PROXY_SECRET_HEADER));

/**
 * A call the storefront makes for itself — rendering a page, not relaying a
 * shopper. It has the secret but no shopper to name, and every such call comes
 * from the one deployment, so counting them per address would throttle the shop
 * as a whole rather than any visitor of it.
 */
const isInternalCall = (req) => fromTrustedProxy(req) && !req.get(CLIENT_IP_HEADER);

/* Whether a forwarding header may be believed on a request that did not come
   through our own proxy. True on Vercel, whose edge overwrites X-Forwarded-For
   and refuses to pass an external one through. Anywhere else it is off unless
   the operator says their proxy is trustworthy too. */
const onVercel = Boolean(process.env.VERCEL);

const trustForwardedHeader = onVercel || process.env.TRUST_FORWARDED_FOR === "true";

/**
 * How many proxies of our own sit in front of this process.
 *
 * This decides which entry of X-Forwarded-For is the caller, and getting it
 * wrong is a silent rate-limit bypass rather than an error. Most proxies —
 * Render, nginx, Cloudflare — *append* the address they saw, so the list reads
 * "whatever the client sent, then the truth". Reading it left to right there
 * hands the key straight back to the caller, who can put anything they like at
 * the front. Counting from the right instead skips our own hops and lands on
 * the last address a machine we trust actually observed.
 *
 * Vercel is the exception and needs none of this: it replaces the header
 * outright, so there is only ever one entry and it is the real one.
 */
const proxyHops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1) || 1);

const entries = (value) =>
    (value ?? "").split(",").map((part) => part.trim()).filter(Boolean);

const firstAddress = (value) => entries(value)[0] ?? null;

/** The last address our own proxies did not add themselves. */
const addressBehindProxies = (value) => {
    const chain = entries(value);

    if (!chain.length) return null;

    /* One hop means the rightmost entry; two means the one before it, and so
       on. Clamped, so a chain shorter than expected yields its leftmost entry
       rather than undefined. */
    return chain[Math.max(0, chain.length - proxyHops)] ?? chain[0];
};

/** The address to hold responsible for this request. */
const clientIp = (req) => {
    if (fromTrustedProxy(req)) {
        const relayed = firstAddress(req.get(CLIENT_IP_HEADER));
        if (relayed) return relayed;
    }

    if (trustForwardedHeader) {
        /* Vercel's own header is written by its edge and is a single address. */
        const edge = onVercel
            ? firstAddress(req.get("x-vercel-forwarded-for")) ??
              firstAddress(req.get("x-forwarded-for"))
            : addressBehindProxies(req.get("x-forwarded-for")) ??
              firstAddress(req.get("x-real-ip"));

        if (edge) return edge;
    }

    /* The connection itself, read off the socket rather than from req.ip.
       That distinction is the whole point of this function: `trust proxy` is
       set, so Express builds req.ip out of X-Forwarded-For — the header any
       caller can write for themselves. Falling back to req.ip would hand the
       key back to the very person the limit is meant to hold, and it would do
       it silently, because everything still looks like it is working. */
    return req.socket?.remoteAddress || "unknown";
};

/**
 * The address as a limiter key.
 *
 * ipKeyGenerator collapses an IPv6 address to its /64 prefix. A single consumer
 * is routinely handed far more than one IPv6 address, so keying on the whole
 * thing would let anybody with an IPv6 line walk straight past the limit by
 * using a different address each time.
 */
const clientIpKey = (req) => ipKeyGenerator(clientIp(req));

module.exports = {
    clientIp,
    clientIpKey,
    fromTrustedProxy,
    isInternalCall,
    CLIENT_IP_HEADER,
    PROXY_SECRET_HEADER
};
