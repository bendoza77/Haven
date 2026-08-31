import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { apiBase } from "@/lib/api-url";
import { CATALOGUE_TAG } from "@/lib/products";

/**
 * Drops the cached catalogue, so a console edit is in the shop immediately.
 *
 * The storefront caches the product list for a minute, which is what makes a
 * page render without waiting on the API. That is only acceptable because of
 * this route: after a console writes a product, it calls here, the tag is
 * purged, and the very next render fetches again. Staleness is therefore
 * bounded by "nobody has changed anything", not by a timer.
 *
 * Who is allowed to do that is decided by the API, not here. The caller's own
 * session cookie is forwarded to /account/me and the answer's role is what
 * gates the purge — the same check that gates the write itself. Deliberately
 * not a shared secret: this is called from a browser, and a secret a browser
 * holds is a secret everybody holds.
 *
 * It sits outside /api because that path is rewritten wholesale to Express;
 * this is one of the few things the storefront itself has to answer.
 */
export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie");

  if (!cookie) {
    return NextResponse.json({ status: "fail", message: "Not signed in" }, { status: 401 });
  }

  let role: string | undefined;

  try {
    const response = await fetch(`${apiBase()}/account/me`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ status: "fail", message: "Not signed in" }, { status: 401 });
    }

    const body = (await response.json()) as { data?: { role?: string } };
    role = body.data?.role;
  } catch {
    /* The API is the authority on who this is. If it cannot be reached there
       is no way to authorise the purge, and refusing is the safe answer —
       the catalogue simply expires on its own a minute later. */
    return NextResponse.json({ status: "error", message: "Could not verify" }, { status: 502 });
  }

  if (role !== "admin" && role !== "moderator") {
    return NextResponse.json({ status: "fail", message: "Not allowed" }, { status: 403 });
  }

  revalidateTag(CATALOGUE_TAG, { expire: 0 });

  return NextResponse.json({ status: "success", data: null });
}
