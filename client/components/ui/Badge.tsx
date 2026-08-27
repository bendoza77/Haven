import { cn } from "@/lib/utils";

const tones = {
  new: "bg-ink text-canvas",
  sale: "bg-accent text-canvas",
  bestseller: "bg-canvas text-ink ring-1 ring-line-strong",
  soft: "bg-surface-strong text-ink-muted",
} as const;

export default function Badge({
  tone = "soft",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
