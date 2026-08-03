import { useState } from "react";
import brandLogo from "@/assets/brand-logo.png.asset.json";

/**
 * Store logo slot. Falls back to /logo.png, then to a typographic gold badge,
 * so no broken image icon can appear on any host.
 */
export function HeaderLogo({ className = "" }: { className?: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const src = step === 0 ? brandLogo.url : "/logo.png";

  return (
    <span className={`flex items-center gap-3 no-select ${className}`}>
      {step === 2 ? (
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 bg-primary text-sm font-bold text-primary-foreground"
        >
          NM
        </span>
      ) : (
        <img
          src={src}
          alt="Nail by Muskii logo"
          width={48}
          height={48}
          onError={() => setStep((current) => (current === 0 ? 1 : 2))}
          className="h-11 w-11 rounded-full border border-gold/60 object-cover"
        />
      )}
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
