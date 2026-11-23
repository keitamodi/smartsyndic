import { Link, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import { LEGAL, LEGAL_PAGES } from '@/lib/legal';

export default function LegalPage({ kicker, title, description, sections }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <main className="mx-auto w-full max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 sm:pt-12">
        <p className="kicker">{kicker}</p>
        <h1 className="mt-3 max-w-[720px] font-heading text-[30px] font-semibold leading-[1.1] sm:text-[40px]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-[640px] text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
        )}
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11.5px] text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
          Dernière mise à jour : {LEGAL.lastUpdated}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
          <nav aria-label="Sommaire" className="hidden lg:sticky lg:top-24 lg:block">
            <p className="kicker">Sommaire</p>
            <ul className="mt-3 space-y-1">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 rounded-lg px-2.5 py-1.5 text-[12px] leading-snug text-muted-foreground transition hover:bg-secondary/70 hover:text-foreground"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="space-y-3">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-[22px] border border-border bg-card p-5 sm:p-6"
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[10px] text-primary">{String(index + 1).padStart(2, '0')}</span>
                  <h2 className="text-[15px] font-semibold leading-snug text-foreground">{section.title}</h2>
                </div>
                <div className="mt-2.5 space-y-2.5">
                  {(section.paragraphs || []).map((paragraph) => (
                    <p key={paragraph} className="text-[12.5px] leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                  {section.items && (
                    <ul className="space-y-1.5">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11.5px] text-muted-foreground">Voir aussi :</span>
              {LEGAL_PAGES.filter((page) => page.to !== pathname).map((page) => (
                <Link
                  key={page.to}
                  to={page.to}
                  className="rounded-full border border-border bg-card px-3 py-1 text-[11.5px] text-foreground/75 transition hover:border-primary/40 hover:text-foreground"
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}