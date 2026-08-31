"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Navigation link that marks itself active for the current route. */
export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  // Links with a query string describe a filtered view, not a section, so
  // only plain paths take the active treatment.
  const isActive = href.includes("?")
    ? false
    : href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        // Single line by contract: the underline is drawn on the box, so a
        // wrapped label would underline only its last line.
        "relative whitespace-nowrap py-1 text-sm transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform hover:after:scale-x-100",
        isActive ? "text-ink after:scale-x-100" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
