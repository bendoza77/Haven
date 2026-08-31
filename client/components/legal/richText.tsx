import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";

/**
 * Tag handlers for the legal prose.
 *
 * These two documents are the only long-form copy in the app, and they carry
 * structure — paragraphs, lists, emphasis and links — that a flat string
 * cannot. Rather than splitting each clause into a dozen fragments (which
 * makes a translation impossible to read and easy to reorder wrongly), each
 * section is one message containing markup tags, rendered through
 * `t.rich()`. A translator sees a whole clause and moves the tags with the
 * words they belong to.
 */
export const legalTags = {
  p: (chunks: React.ReactNode) => <p>{chunks}</p>,
  ul: (chunks: React.ReactNode) => <ul>{chunks}</ul>,
  li: (chunks: React.ReactNode) => <li>{chunks}</li>,
  strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  mail: (chunks: React.ReactNode) => <a href={`mailto:${site.email}`}>{chunks}</a>,
  terms: (chunks: React.ReactNode) => <Link href="/terms">{chunks}</Link>,
  privacy: (chunks: React.ReactNode) => <Link href="/privacy">{chunks}</Link>,
};

/** Values every legal message may interpolate. */
export const legalValues = {
  siteName: site.name,
  email: site.email,
  phone: site.phone,
};
