import { Eye } from "lucide-react";

/**
 * Says out loud what the missing buttons already imply — a moderator can
 * read this screen and add to it, but cannot change what is already there.
 */
export default function ReadOnlyNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3.5 text-sm leading-relaxed text-ink-muted">
      <Eye className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden />
      {children}
    </p>
  );
}
