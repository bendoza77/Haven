"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import Overview from "@/components/console/Overview";
import { ButtonLink } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import type { ConsoleConfig } from "@/lib/console";

/** Greets whoever is actually signed in, then hands over to the dashboard. */
export default function OverviewScreen({ config }: { config: ConsoleConfig }) {
  const t = useTranslations("console");
  const { user } = useAuth();
  const firstName = user?.fullname.split(" ")[0];

  return (
    <div className="space-y-8">
      <ConsoleHeader
        title={
          firstName
            ? t("overview.welcomeBackNamed", { name: firstName })
            : t("overview.welcomeBack")
        }
        description={t(config.blurbKey)}
        actions={
          <>
            {config.can.edit && (
              <ButtonLink href={`${config.base}/products`} variant="secondary">
                {t("overview.manageCatalogue")}
              </ButtonLink>
            )}
            <ButtonLink href={`${config.base}/products/new`}>
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              {t("overview.newProduct")}
            </ButtonLink>
          </>
        }
      />

      <Overview config={config} />
    </div>
  );
}
