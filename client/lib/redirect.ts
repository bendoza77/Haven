/**
 * Where to land after signing in or signing up.
 *
 * A page that sends somebody here to authenticate adds `?next=`; they should
 * come back to it rather than to the account screen. Read at submit time from
 * `window.location` rather than with `useSearchParams`, which would opt the
 * otherwise-static auth pages out of prerendering.
 *
 * Only same-site paths are honoured — an absolute URL in the query string
 * would turn the sign-in form into an open redirect.
 */
export function destinationAfterAuth(fallback = "/account") {
  if (typeof window === "undefined") return fallback;

  const next = new URLSearchParams(window.location.search).get("next");

  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
