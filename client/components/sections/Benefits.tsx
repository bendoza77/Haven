import { getTranslations } from "next-intl/server";
import { Headset, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Container from "@/components/ui/Container";

/* Icon and message key travel together; the wording itself is translated. */
const benefits = [
  { icon: Truck, key: "delivery" },
  { icon: RotateCcw, key: "returns" },
  { icon: ShieldCheck, key: "checkout" },
  { icon: Headset, key: "support" },
] as const;

export default async function Benefits() {
  const t = await getTranslations("benefits");

  return (
    <section className="border-b border-line py-12 lg:py-14">
      <Container>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {benefits.map(({ icon: Icon, key }) => (
            <li key={key} className="flex gap-4">
              <Icon className="size-6 shrink-0 text-ink" strokeWidth={1.5} aria-hidden />
              <div>
                <h3 className="text-sm font-medium text-ink">{t(`${key}Title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {t(`${key}Body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
