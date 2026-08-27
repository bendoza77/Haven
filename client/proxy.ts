import { NextResponse, type NextRequest } from "next/server";

/**
 * Tells the API who is actually calling it.
 *
 * Every browser request to /api is proxied through this deployment, so by the
 * time Express sees it the connection belongs to the storefront and not to the
 * shopper. That is fine for everything except the rate limiter, which then
 * counts the entire world into one bucket and throttles the shop instead of the
 * abuser. So the shopper's address is copied into a header of our own.
 *
 * A header alone would be worthless — the API is on a public hostname, and
 * anybody could call it directly claiming to be a different address on every
 * request, which is a rate limiter switched off. It is therefore sent with a
 * shared secret that only these two deployments hold, and the API believes the
 * address only when that secret checks out.
 *
 * Any inbound copy of these headers is stripped first. Without that, a caller
 * could send their own x-haven-client-ip and have it forwarded verbatim under
 * our signature — which is the same bypass, wearing our badge.
 */
const CLIENT_IP_HEADER = "x-haven-client-ip";
const PROXY_SECRET_HEADER = "x-haven-proxy-secret";

/* Headers a client must never be able to set on a proxied request, because
   something downstream decides who they are from them. */
const SPOOFABLE = [
  CLIENT_IP_HEADER,
  PROXY_SECRET_HEADER,
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-forwarded-for",
];

/**
 * Whether anything in an incoming request can be believed about who sent it.
 *
 * True on Vercel, whose edge writes `x-forwarded-for` itself and refuses to
 * pass an externally supplied one through. Everywhere else these headers are
 * just text the caller chose, so the answer is no unless the operator says
 * their own proxy overwrites them too.
 */
const TRUST_FORWARDING_HEADERS =
  Boolean(process.env.VERCEL) || process.env.TRUST_FORWARDED_FOR === "true";

/**
 * The visitor's address, or nothing.
 *
 * Returning nothing is a real answer and the safe one: the API then falls back
 * to the address the connection actually came from, which over-counts (every
 * visitor shares the storefront's) but can never under-count. Guessing would be
 * worse than not knowing.
 *
 * The care here is the whole point of the file. Stripping a spoofed header on
 * the way in and then reading that same header back to build the trusted one
 * would launder the spoof through our own signature — the API would believe an
 * attacker-chosen address precisely because we vouched for it, which is a rate
 * limiter turned off rather than merely bypassed.
 */
function clientIp(request: NextRequest) {
  if (!TRUST_FORWARDING_HEADERS) return "";

  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip");

  return forwarded?.split(",")[0]?.trim() ?? "";
}

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);

  for (const header of SPOOFABLE) headers.delete(header);

  const secret = process.env.INTERNAL_PROXY_SECRET;
  const ip = clientIp(request);

  /* Both or neither. Sending the address without the secret would have the API
     ignore it and fall back, which is correct but silently unprotected; sending
     the secret without an address would mark this as one of the storefront's
     own calls, which are exempt from per-visitor limits. Neither half is
     useful on its own. */
  if (secret && ip) {
    headers.set(PROXY_SECRET_HEADER, secret);
    headers.set(CLIENT_IP_HEADER, ip);
  }

  /* `request.headers` — not the second argument — is what reaches a rewrite
     destination. The other form would hand these to the browser instead, which
     would publish the secret. */
  return NextResponse.next({ request: { headers } });
}

export const config = {
  /* Only the proxied API. Page requests have nothing downstream to tell. */
  matcher: "/api/:path*",
};
