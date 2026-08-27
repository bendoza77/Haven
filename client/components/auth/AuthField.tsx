"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { passwordStrength } from "@/lib/auth";
import { cn } from "@/lib/utils";

const control =
  "h-11 w-full rounded-md border bg-canvas px-3.5 text-sm text-ink transition-colors placeholder:text-ink-subtle focus:outline-none";

const tone = (error?: string | null) =>
  error
    ? "border-danger hover:border-danger focus:border-danger"
    : "border-line-strong hover:border-ink-subtle focus:border-ink";

function Header({
  id,
  label,
  action,
}: {
  id: string;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {action}
    </div>
  );
}

/** One message slot per field, kept in the DOM so screen readers announce changes. */
function Message({ id, error, hint }: { id: string; error?: string | null; hint?: string }) {
  return (
    <p
      id={`${id}-message`}
      aria-live="polite"
      className={cn("mt-1.5 text-xs", error ? "text-danger" : "text-ink-subtle")}
    >
      {error ?? hint ?? ""}
    </p>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  action?: React.ReactNode;
};

export function TextField({
  id,
  label,
  error,
  hint,
  action,
  className,
  ...props
}: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Header id={id} label={label} action={action} />
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-message`}
        className={cn(control, tone(error))}
        {...props}
      />
      <Message id={id} error={error} hint={hint} />
    </div>
  );
}

export function PasswordField({
  id,
  label,
  error,
  hint,
  action,
  className,
  strength,
  onChange,
  ...props
}: FieldProps & { strength?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const t = useTranslations("validation");
  const tProduct = useTranslations("authForm");
  const [visible, setVisible] = useState(false);
  // Only mirrored into state when the meter needs it — sign-in keeps the field
  // uncontrolled and re-renders nothing while you type.
  const [value, setValue] = useState("");
  const score = strength ? passwordStrength(value) : null;

  return (
    <div className={className}>
      <Header id={id} label={label} action={action} />

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-message`}
          className={cn(control, tone(error), "pr-11")}
          onChange={(event) => {
            if (strength) setValue(event.target.value);
            onChange?.(event);
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? tProduct("hidePassword") : tProduct("showPassword")}
          aria-pressed={visible}
          className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-sm text-ink-subtle transition-colors hover:text-ink"
        >
          {visible ? (
            <EyeOff className="size-4" strokeWidth={1.75} aria-hidden />
          ) : (
            <Eye className="size-4" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>

      {score && (
        <div className="mt-2.5 flex items-center gap-3">
          <span className="flex flex-1 gap-1" aria-hidden>
            {[0, 1, 2, 3].map((step) => (
              <span
                key={step}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step <= score.level ? score.bar : "bg-line",
                )}
              />
            ))}
          </span>
          <span className={cn("text-xs font-medium", score.text)}>
            {t(`strength.${score.key}`)}
          </span>
        </div>
      )}

      <Message id={id} error={error} hint={hint} />
    </div>
  );
}

export function CheckboxField({
  id,
  error,
  className,
  children,
  ...props
}: {
  id: string;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-message` : undefined}
          className="mt-0.5 size-4 shrink-0 rounded-sm accent-ink"
          {...props}
        />
        <label htmlFor={id} className="text-sm leading-relaxed text-ink-muted">
          {children}
        </label>
      </div>
      {error && <Message id={id} error={error} />}
    </div>
  );
}
