/**
 * How the session cookie is written, in one place.
 *
 * `Secure` and `SameSite=None` are what let a cookie survive a cross-site
 * request, which is what a browser considers any call from the storefront to
 * an API on a different host. Neither works over plain http, so both are off
 * when the API is running on localhost.
 *
 * The switch is deliberately not NODE_ENV on its own. This project's .env uses
 * "prod", Node's own convention is "production", and Vercel sets "production"
 * for you and does not let you replace it — so a check for one spelling is
 * wrong on the other. Getting it wrong does not fail loudly: the browser
 * simply drops the cookie and every screen behaves as though nobody is signed
 * in. VERCEL is set on every deployment, which settles the question there, and
 * the two spellings cover a deployment anywhere else.
 */
const isProduction =
    process.env.NODE_ENV === "prod" ||
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL);

/** The attributes every write of the `hv` cookie shares. */
const sessionCookieOptions = () => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
    path: "/"
});

module.exports = { isProduction, sessionCookieOptions };
