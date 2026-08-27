import { cn } from "@/lib/utils";

const control =
  "h-11 w-full rounded-md border border-line-strong bg-canvas px-3.5 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-ink-subtle focus:border-ink focus:outline-none";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-ink-subtle">{children}</p>;
}

export function Input({
  id,
  label,
  hint,
  className,
  ...props
}: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} className={control} {...props} />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function Textarea({
  id,
  label,
  hint,
  className,
  rows = 4,
  ...props
}: { id: string; label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={rows}
        className={cn(control, "h-auto resize-y py-2.5 leading-relaxed")}
        {...props}
      />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function Select({
  id,
  label,
  hint,
  className,
  children,
  ...props
}: { id: string; label: string; hint?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={cn(control, "pr-9")} {...props}>
        {children}
      </select>
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}
