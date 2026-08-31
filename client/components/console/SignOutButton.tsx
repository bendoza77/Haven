"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useConsoleAuth } from "@/context/ConsoleAuthContext";

/** Ends the staff session for real, then drops back to the shop. */
export default function SignOutButton() {
  const t = useTranslations("console");
  const router = useRouter();
  const { signOutStaff } = useConsoleAuth();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signOutStaff();
        } finally {
          router.push("/");
          router.refresh();
        }
      }}
      aria-label={t("shell.signOut")}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface hover:text-ink disabled:opacity-60"
    >
      <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
