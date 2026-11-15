import BackButton from '@/components/BackButton';

export default function PageHeader({ kicker, title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <BackButton />
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="text-[26px] leading-tight text-foreground sm:text-[32px]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}