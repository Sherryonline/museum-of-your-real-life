export function ProgressBar({ value }: Readonly<{ value: number }>) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${Math.round(clamped)}% complete`}>
      <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}
