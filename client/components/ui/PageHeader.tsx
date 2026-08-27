import Breadcrumb, { type Crumb } from "@/components/ui/Breadcrumb";
import Container from "@/components/ui/Container";

export default function PageHeader({
  breadcrumb,
  title,
  description,
  meta,
}: {
  breadcrumb: Crumb[];
  title: string;
  description?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <Container>
        <div className="py-8 lg:py-12">
          <Breadcrumb items={breadcrumb} />
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
                {title}
              </h1>
              {description && (
                <p className="mt-3 text-base leading-relaxed text-ink-muted">{description}</p>
              )}
            </div>
            {meta && <div className="shrink-0 text-sm text-ink-muted">{meta}</div>}
          </div>
        </div>
      </Container>
    </div>
  );
}
