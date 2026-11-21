export const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    subtitle: 'Découverte',
    price: '0 €',
    suffix: '/ mois',
    cta: 'Démarrer gratuitement',
    limits: { buildings: 1, lots: 5, ai: 20, seats: 1 },
    features: [
      { label: 'Immeubles gérés', value: '1 immeuble max' },
      { label: 'Lots principaux', value: '5 lots max' },
      { label: 'Enveloppe IA RAG', value: '20 questions / mois' },
      { label: 'Équipe cabinet', value: '1 utilisateur (administrateur)' },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Pour un premier parc',
    price: '32,90 €',
    suffix: 'HT / mois',
    cta: 'Choisir Starter',
    limits: { buildings: 5, lots: 75, ai: 150, seats: 1 },
    features: [
      { label: 'Immeubles gérés', value: '5 immeubles max' },
      { label: 'Lots principaux', value: '75 lots max' },
      { label: 'Enveloppe IA RAG', value: '150 questions / mois' },
      { label: 'Équipe cabinet', value: '1 utilisateur (administrateur)' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Pour un cabinet qui grandit',
    price: '64,90 €',
    suffix: 'HT / mois',
    cta: 'Choisir Pro',
    recommended: true,
    limits: { buildings: 15, lots: 250, ai: 600, seats: 3 },
    features: [
      { label: 'Immeubles gérés', value: '15 immeubles max' },
      { label: 'Lots principaux', value: '250 lots max' },
      { label: 'Enveloppe IA RAG', value: '600 questions / mois' },
      { label: 'Équipe cabinet', value: '3 utilisateurs inclus' },
    ],
  },
  {
    id: 'expert',
    name: 'Expert',
    subtitle: 'Pour les parcs importants',
    price: '129,90 €',
    suffix: 'HT / mois',
    cta: 'Choisir Expert',
    limits: { buildings: 40, lots: 800, ai: null, seats: 6 },
    features: [
      { label: 'Immeubles gérés', value: '40 immeubles max' },
      { label: 'Lots principaux', value: '800 lots max' },
      { label: 'Enveloppe IA RAG', value: 'Illimité' },
      { label: 'Équipe cabinet', value: '6 utilisateurs inclus' },
    ],
    note: 'Fair-use technique : 2 500 questions IA par mois.',
  },
];

export const DEFAULT_PLAN_ID = 'free';

export function planById(id) {
  return PLANS.find((plan) => plan.id === id) || PLANS[0];
}

export function planRank(id) {
  return PLANS.findIndex((plan) => plan.id === id);
}