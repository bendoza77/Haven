export default function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-line" aria-hidden />
      <span className="text-xs uppercase tracking-[0.14em] text-ink-subtle">{children}</span>
      <span className="h-px flex-1 bg-line" aria-hidden />
    </div>
  );
}
