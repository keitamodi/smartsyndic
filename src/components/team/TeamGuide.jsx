const STEPS = [
  {
    title: 'Renseignez le collaborateur',
    text: 'Nom et email professionnel : l’invitation part sur cette adresse.',
  },
  {
    title: 'Choisissez son rôle',
    text: 'Le rôle définit les écrans et les actions autorisés.',
  },
  {
    title: 'Définissez son périmètre',
    text: 'Aucun immeuble coché : accès à tous les immeubles du syndic.',
  },
];

export default function TeamGuide() {
  return (
    <div className="grid gap-3 rounded-[20px] border border-border/70 bg-secondary/30 p-3.5 sm:grid-cols-3">
      {STEPS.map((step, index) => (
        <div key={step.title} className="flex gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card font-mono text-[10px] font-semibold text-primary ring-1 ring-border">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-foreground">{step.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}