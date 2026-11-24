import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--accent))_0%,hsl(var(--background))_70%)] text-foreground">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_hsl(var(--primary))]">
            <span className="font-mono text-[12px] font-semibold tracking-tight">SS</span>
          </span>
          <span className="min-w-0">
            <span className="block font-heading text-[15.5px] font-semibold leading-tight">Smartsyndic</span>
            <span className="kicker !text-[8.5px] !tracking-[0.16em]">Gestion de copropriété</span>
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à l’accueil
        </Link>
      </div>

      <div className="flex justify-center px-4 pb-16 pt-4 sm:pt-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-6 text-center">
            {Icon && (
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </div>
            )}
            <h1 className="font-heading text-[26px] font-semibold leading-tight tracking-[-0.03em] text-foreground">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="rounded-[24px] border border-border bg-card p-6 shadow-[0_28px_60px_-45px_rgba(41,25,15,0.55)] sm:p-8">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-[12.5px] text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}