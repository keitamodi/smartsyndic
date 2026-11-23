export const AUTOMATION_EMAIL = 'automations@smartsyndic.app';

export const AUTOMATIONS = [
  {
    key: 'interventions',
    logLabel: 'Relances interventions',
    title: "Relances d'interventions",
    description:
      'Prévient avant chaque entretien programmé et alerte dès qu’une intervention dépasse sa date.',
    cadence: 'Chaque jour · 08:00',
  },
  {
    key: 'impayes',
    logLabel: 'Relances impayés',
    title: 'Relances d’impayés',
    description:
      'Fait monter chaque appel de fonds non réglé d’un cran : rappel, relance, mise en demeure, contentieux.',
    cadence: 'Chaque jour · 08:15',
  },
  {
    key: 'assemblees',
    logLabel: "Convocations d'AG",
    title: 'Convocations d’AG',
    description:
      'Alerte 21 jours avant chaque assemblée tant que la convocation n’est pas partie.',
    cadence: 'Chaque jour · 08:30',
  },
];