/**
 * Where the Express API lives, answered differently depending on who is asking.
 *
 * In the browser the answer is a root-relative "/api": the storefront proxies
 * that path through to the API (see the rewrites in next.config.ts), so as far
 * as the browser is concerned the shop and its API are one origin. That is not
 * a cosmetic choice — the session is a cookie, and a cookie sent to a
 * different site is a third-party cookie, which Safari blocks outright and
 * Chrome is phasing out. Same origin keeps signing in working everywhere.
 *
 * On the server there is no current origin to resolve "/api" against, so an
 * absolute URL has to be built. API_ORIGIN points straight at the API and
 * skips the proxy hop; failing that we address our own deployment and let the
 * rewrite do its job.
 *
 * Setting NEXT_PUBLIC_API_URL to an absolute URL opts out of all of this and
 * talks to the API cross-origin — useful locally, and the reason the two
 * halves can still be run on separate ports.
 */
const configured = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/+$/, "");

const isAbsolute = /^https?:\/\//i.test(configured);

function serverOrigin() {
  const explicit = process.env.API_ORIGIN?.replace(/\/+$/, "");
  if (explicit) return explicit;

  /* Vercel sets this to the deployment's own hostname, without a scheme. */
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/** The base every request path is appended to. Never ends in a slash. */
export function apiBase() {
  if (isAbsolute) return configured;

  /* A relative base only means something where there is a document to resolve
     it against. */
  if (typeof window !== "undefined") return configured;

  return `${serverOrigin()}${configured}`;
}
