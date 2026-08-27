import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "inverseOutline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-canvas hover:bg-ink/90 active:bg-ink disabled:bg-ink/40",
  secondary: "border border-line-strong bg-canvas text-ink hover:border-ink hover:bg-surface",
  ghost: "text-ink hover:bg-surface",
  inverse: "bg-feature-ink text-feature hover:bg-feature-ink/90",
  inverseOutline:
    "border border-feature-ink/35 text-feature-ink hover:border-feature-ink hover:bg-feature-ink/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

/** Square variants for buttons whose only content is an icon. */
const iconSizes: Record<Size, string> = {
  sm: "size-9",
  md: "size-11",
  lg: "size-13",
};

/* `whitespace-nowrap`: Georgian labels run appreciably longer than their
   English counterparts, and a two-word button that wraps grows taller than
   its neighbours and leaves the row ragged. */
const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium tracking-tight transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:shrink-0";

type Props = {
  variant?: Variant;
  size?: Size;
  icon?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

const classesFor = ({ variant = "primary", size = "md", icon, fullWidth, className }: Props) =>
  cn(
    base,
    variants[variant],
    icon ? iconSizes[size] : sizes[size],
    fullWidth && "w-full",
    className,
  );

export function Button({
  variant,
  size,
  icon,
  fullWidth,
  className,
  children,
  ...props
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={classesFor({ variant, size, icon, fullWidth, className, children })}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  fullWidth,
  className,
  children,
  ...props
}: Props & React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={classesFor({ variant, size, icon, fullWidth, className, children })}
      {...props}
    >
      {children}
    </Link>
  );
}
