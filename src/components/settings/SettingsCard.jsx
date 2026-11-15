export default function SettingsCard({ icon: Icon, title, description, children, footer }) {
  return (
    <section className="rounded-[22px] border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-heading text-[14px] font-semibold leading-tight text-foreground">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-3 divide-y divide-border/70">{children}</div>
      {footer && <div className="mt-3 border-t border-border/70 pt-3">{footer}</div>}
    </section>
  );
}