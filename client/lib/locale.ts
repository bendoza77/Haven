import type { Locale } from "@/i18n/config";

/**
 * The document language drives font selection, hyphenation and the CSS that
 * de-tracks Georgian, so the switcher sets it eagerly rather than waiting for
 * the navigation to commit — otherwise Georgian gets one paint in a font that
 * has no glyphs for it.
 *
 * Reading and writing the locale cookie used to live here too. It does not any
 * more: the locale is in the URL, and the cookie — which now only decides
 * where to send someone who asks for a bare path — is written by the
 * middleware, where the decision is actually made.
 */
export function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
}
