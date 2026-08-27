import StorefrontChrome from "@/components/layout/StorefrontChrome";

/** The public shop. The console group next door draws its own frame instead. */
export default function StorefrontLayout({ children }: LayoutProps<"/">) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
