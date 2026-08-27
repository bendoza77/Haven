import { Plus } from "lucide-react";

/** Native disclosure — open/close needs no JavaScript. */
export default function Disclosure({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <Plus
          className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-45"
          aria-hidden
        />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-ink-muted">{children}</div>
    </details>
  );
}
