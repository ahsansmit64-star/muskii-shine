import type { InputHTMLAttributes } from "react";

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-gold-deep"
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}