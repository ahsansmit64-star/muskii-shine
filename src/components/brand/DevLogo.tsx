import { useState } from "react";
import devLogo from "@/assets/dev-logo.png.asset.json";

/** Developer logo slot with /dev-logo.png and typographic badge fallbacks. */
export function DevLogo({ className = "" }: { className?: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const src = step === 0 ? devLogo.url : "/dev-logo.png";

  return (
    <span className={`flex items-center gap-3 no-select ${className}`}>
      {step === 2 ? (
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-primary text-sm font-bold text-primary-foreground"
        >
          MD
        </span>
      ) : (
        <img
          src={src}
          alt="MAN.DEV logo"
          width={56}
          height={56}
          loading="lazy"
          onError={() => setStep((current) => (current === 0 ? 1 : 2))}
          className="h-12 w-12 rounded-md border border-border object-cover"
        />
      )}
      <span className="text-sm font-bold tracking-[0.18em] text-primary">MAN.DEV</span>
    </span>
  );
}
