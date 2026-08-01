import devLogo from "@/assets/dev-logo.png.asset.json";

/** Developer logo slot. Replace the imported asset to swap in a new file. */
export function DevLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 no-select ${className}`}>
      <img
        src={devLogo.url}
        alt="MAN.DEV logo"
        width={56}
        height={56}
        loading="lazy"
        className="h-12 w-12 rounded-md border border-border object-cover"
      />
      <span className="text-sm font-bold tracking-[0.18em] text-primary">MAN.DEV</span>
    </span>
  );
}