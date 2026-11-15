import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHOTOS = [
  {
    src: 'https://media.base44.com/images/public/6af6008df25fa7c8fe5afd5d/938c93272_generated_image.png',
    alt: 'Façade haussmannienne éclairée par le soleil couchant',
  },
  {
    src: 'https://media.base44.com/images/public/6af6008df25fa7c8fe5afd5d/330b49218_generated_image.png',
    alt: 'Hall d’entrée d’un immeuble de copropriété',
  },
  {
    src: 'https://media.base44.com/images/public/6af6008df25fa7c8fe5afd5d/831948e4b_generated_image.png',
    alt: 'Cour intérieure arborée d’un immeuble',
  },
];

export default function LandingHero() {
  const goToForm = () => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section
      aria-label="Présentation de SyndicVibe"
      className="relative overflow-hidden border-b border-border/60 bg-[linear-gradient(180deg,hsl(var(--accent))_0%,hsl(var(--background))_82%)]"
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col px-5 pt-14 sm:px-8 sm:pt-20">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Plateforme pour syndics et copropriétaires
          </span>

          <h1 className="mt-5 max-w-[880px] font-heading text-[clamp(2.3rem,1.35rem+4.2vw,4.05rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-foreground">
            La copropriété, tenue avec soin.
          </h1>

          <p className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
            Immeubles, appels de fonds, assemblées générales, interventions et échanges avec les résidents : tout
            votre syndicat dans un espace unique, clair et traçable.
          </p>

          <Button size="lg" className="mt-7 gap-2 rounded-full px-6 text-[13.5px]" onClick={goToForm}>
            Inscrire mon syndicat
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-12 grid h-[clamp(180px,31vw,376px)] grid-cols-3 gap-3 overflow-hidden sm:gap-4">
          {PHOTOS.map((photo, index) => (
            <div
              key={photo.src}
              className={cn('min-w-0', index === 1 && 'translate-y-[clamp(0px,5vw,52px)]')}
            >
              <figure className="relative m-0 h-[calc(100%+clamp(40px,8vw,110px))] w-full overflow-hidden rounded-t-[18px] bg-secondary">
                <Image src={photo.src} alt={photo.alt} className="h-full w-full object-cover object-top" />
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}