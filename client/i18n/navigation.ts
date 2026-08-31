import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for `next/link` and `next/navigation`.
 *
 * Every internal link in the app comes from here. They take the paths the app
 * has always used — `/shop`, `/product/x` — and add the locale prefix when the
 * active language needs one, so no call site has to know or care that the
 * locale is in the URL at all.
 *
 * Importing `Link` from `next/link` instead would drop a reader out of their
 * language on the next click, which is why the two are not interchangeable.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
