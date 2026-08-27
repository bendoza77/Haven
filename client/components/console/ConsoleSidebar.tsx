"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import ConsoleNav from "@/components/console/ConsoleNav";
import SignOutButton from "@/components/console/SignOutButton";
import { useConsoleAuth } from "@/context/ConsoleAuthContext";
import { initialsOf, staffName, type ConsoleConfig } from "@/lib/console";
import { site } from "@/lib/site";

/**
 * The rail: who you are, where you can go, and the way back to the shop.
 * Rendered twice — fixed on large screens, and inside the drawer below it.
 */
export default function ConsoleSidebar({
  config,
  onNavigate,
}: {
  config: ConsoleConfig;
  onNavigate?: () => void;
}) {
  const t = useTranslations("console");
  const { staff } = useConsoleAuth();

  const name = staffName(staff) ?? t("shell.signedOut");

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-line px-5 py-5">
        <Link
          href={config.base}
          onClick={onNavigate}
          className="block font-display text-2xl leading-none tracking-tight text-ink"
        >
          {site.name}
        </Link>
        <p className="mt-2 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-ink-subtle">
          {t(config.labelKey)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-6">
        <ConsoleNav config={config} onNavigate={onNavigate} />
      </div>

      <div className="border-t border-line px-3 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-canvas/60 hover:text-ink"
        >
          {t("shell.viewStorefront")}
          <ArrowUpRight className="size-4" strokeWidth={1.75} aria-hidden />
        </Link>

        <div className="mt-2 flex items-center gap-3 rounded-md bg-canvas p-3 shadow-card">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-medium text-canvas"
          >
            {staff ? initialsOf(name) : "—"}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">
              {name}
            </span>
            <span className="block truncate text-xs text-ink-subtle">
              {t(config.roleLabelKey)}
            </span>
          </span>

          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
