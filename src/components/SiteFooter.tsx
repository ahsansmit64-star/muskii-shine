import { Instagram, Mail, Globe, Linkedin, Briefcase } from "lucide-react";
import { DevLogo } from "@/components/brand/DevLogo";

const STORE_INSTAGRAM =
  "https://www.instagram.com/nail_diaries_by_muskiii?igsh=Mnd3MXkzMHNiazZ6";

const devLinks = [
  { label: "ahsansmit64@gmail.com", href: "mailto:ahsansmit64@gmail.com", icon: Mail },
  { label: "Portfolio", href: "https://portfolio-4-jet-rho.vercel.app/", icon: Globe },
  {
    label: "Fiverr",
    href: "https://www.fiverr.com/mohammad_ahsan6/buying?source=avatar_menu_profile",
    icon: Briefcase,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/muhammad-ahsan-622880409/",
    icon: Linkedin,
  },
  { label: "Instagram", href: "https://www.instagram.com/man.devs/?hl=en", icon: Instagram },
];

export function SiteFooter() {
  return (
    <footer className="lazy-section border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold text-primary">Nail by Muskii</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Handmade press-on nail sets, made to your size and shape. Delivery across Pakistan.
          </p>
          <a
            href={STORE_INSTAGRAM}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-md border border-gold px-4 text-sm font-semibold text-primary hover:bg-gold hover:text-accent-foreground"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />
            @nail_diaries_by_muskiii
          </a>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Built by
          </p>
          <div className="mt-3">
            <DevLogo />
          </div>
          <ul className="mt-4 grid gap-1">
            {devLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground hover:text-gold-deep"
                >
                  <link.icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nail by Muskii. All rights reserved.
      </div>
    </footer>
  );
}