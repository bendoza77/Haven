"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

/**
 * Blocking confirmation for the two actions that cannot be undone. Kept
 * deliberately plain: the thing being removed is named in the body so nobody
 * confirms the wrong row.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("dialog");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("cancel")}
        onClick={onCancel}
        className="absolute inset-0 bg-feature/50 backdrop-blur-[2px]"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md rounded-lg border border-line bg-canvas p-6 shadow-pop"
      >
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger"
          >
            <AlertTriangle className="size-5" strokeWidth={1.75} />
          </span>

          <div className="min-w-0">
            <h2 id="confirm-title" className="font-display text-xl tracking-tight text-ink">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-10 items-center justify-center rounded-md border border-line-strong bg-canvas px-5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-surface disabled:opacity-60"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex h-10 items-center justify-center rounded-md bg-danger px-5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? t("working") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
