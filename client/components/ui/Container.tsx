import { cn } from "@/lib/utils";

/** The single content width used by every page and section. */
export default function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[82rem] px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
