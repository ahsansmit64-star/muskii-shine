import brandLogo from "@/assets/brand-logo.png.asset.json";

/**
 * Store logo slot. Replace the imported asset to swap in a new file.
 * Falls back to the wordmark if the image cannot load.
 */
export function HeaderLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 no-select ${className}`}>
      <img
        src={brandLogo.url}
        alt="Nail by Muskii logo"
        width={48}
        height={48}
        className="h-11 w-11 rounded-full border border-gold/60 object-cover"
      />
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight text-primary">
          Nail by <span className="text-gold-deep">Muskii</span>
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Nail Studio
        </span>
      </span>
    </span>
  );
}