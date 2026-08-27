import { cn } from "@/lib/utils";

/**
 * Table shell. Wide tables scroll inside the card rather than pushing the
 * page sideways, so the shell owns the overflow and the rows stay simple.
 */
export function Table({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-left">
        <thead className="bg-surface/60">
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  align = "left",
  className,
  children,
}: {
  align?: "left" | "right";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-4 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-subtle",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-t border-line transition-colors hover:bg-surface/40">{children}</tr>
  );
}

export function Td({
  align = "left",
  className,
  children,
}: {
  align?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-sm text-ink-muted",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}

/**
 * Product thumbnail. A plain `img` on purpose: catalogue images in the
 * console can point anywhere an operator pastes, and the optimiser only
 * accepts hosts declared in `next.config.ts`.
 */
export function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="block size-11 shrink-0 overflow-hidden rounded-md bg-surface ring-1 ring-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
    </span>
  );
}
