"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2 } from "lucide-react";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import { RolePill } from "@/components/console/Pills";
import UserForm from "@/components/console/UserForm";
import { useUser } from "@/context/UserContext";
import type { ConsoleConfig } from "@/lib/console";
import { useDates } from "@/lib/format";

/**
 * The edit screen for one account.
 *
 * The account is read in the browser rather than on the server because the
 * session is an httpOnly cookie the API expects from the browser — a server
 * render here would have to forward it by hand, and would then be a second
 * path to keep in step with the rest of the console.
 */
export default function UserEditor({ config, id }: { config: ConsoleConfig; id: string }) {
  const t = useTranslations("console");
  const dates = useDates();
  const { user, loading, error, getUserById } = useUser();

  useEffect(() => {
    void getUserById(id);
  }, [getUserById, id]);

  /* Guard against showing the previously-opened account for a frame while the
     new one is still in flight. */
  const showing = user?._id === id ? user : null;

  if (error && !showing) {
    return (
      <div className="space-y-8">
        <ConsoleHeader
          breadcrumb={[
            { label: t("breadcrumb.console"), href: config.base },
            { label: t("breadcrumb.users"), href: `${config.base}/users` },
            { label: t("breadcrumb.notFound") },
          ]}
          title={t("users.notFoundTitle")}
        />
        <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {error}
        </p>
      </div>
    );
  }

  if (!showing) {
    return (
      <p className="flex items-center justify-center gap-2.5 px-5 py-24 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        {loading ? t("users.opening") : t("users.nothingToShow")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <ConsoleHeader
        breadcrumb={[
          { label: t("breadcrumb.console"), href: config.base },
          { label: t("breadcrumb.users"), href: `${config.base}/users` },
          { label: showing.fullname },
        ]}
        title={showing.fullname}
        description={`${t("users.joined", { date: dates.short(showing.createdAt) })} · ${showing.email}`}
        actions={
          <span className="flex items-center">
            <RolePill role={showing.role} />
          </span>
        }
      />

      <UserForm config={config} user={showing} submitLabel="Save changes" />
    </div>
  );
}
