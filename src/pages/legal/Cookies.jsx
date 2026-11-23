import LegalPage from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

const SECTIONS = [
  {
    id: 'definition',
    title: 'Qu’est-ce qu’un cookie ?',
    paragraphs: [
      "Un cookie est un petit fichier déposé par un site dans votre navigateur lors de votre visite. Il permet notamment de maintenir votre session ouverte et de mémoriser vos préférences.",
      "Le service utilise également le stockage local du navigateur, qui fonctionne de façon comparable mais conserve les informations côté navigateur sans les transmettre à chaque requête.",
    ],
  },
  {
    id: 'necessaires',
    title: 'Cookies strictement nécessaires',
    paragraphs: [
      "Ces cookies sont indispensables au fonctionnement du service et ne peuvent pas être désactivés sans rendre l'application inutilisable :",
    ],
    items: [
      "cookie de session et jeton d'authentification : maintient votre connexion et protège l'accès à votre espace ;",
      "mémorisation de l'espace syndic sélectionné : conserve le cabinet actif lorsque vous appartenez à plusieurs espaces ;",
      "préférences d'interface et paramètres d'affichage enregistrés dans votre navigateur.",
    ],
  },
  {
    id: 'mesure',
    title: 'Mesure d’audience et traceurs publicitaires',
    paragraphs: [
      "Le service n'utilise pas de cookie publicitaire, de pixel de réseau social ni de traceur de reciblage.",
      "Les statistiques d'usage sont produites à partir de données agrégées et ne permettent pas de vous identifier individuellement.",
      "Les pages publiques (accueil, tarifs, pages légales) n'activent aucun traceur non nécessaire. Si un outil de mesure d'audience venait à être ajouté, votre consentement serait recueilli au préalable et ce document serait mis à jour.",
    ],
  },
  {
    id: 'tiers',
    title: 'Cookies de prestataires',
    paragraphs: [
      "Le paiement en ligne des abonnements est opéré par Stripe. Lorsque vous accédez au module de paiement, ce prestataire peut déposer ses propres cookies de sécurité et de détection de fraude, nécessaires à la transaction.",
      "Les emails transactionnels envoyés depuis le service peuvent contenir des liens de suivi d'ouverture gérés par le prestataire d'emailing, utilisés uniquement pour établir qu'un envoi a bien été distribué.",
    ],
  },
  {
    id: 'duree',
    title: 'Durées de conservation',
    paragraphs: [
      "Le cookie d'authentification expire à la fin de votre session ou selon la durée de validité du jeton de connexion.",
      "La préférence d'espace syndic et les réglages d'affichage sont conservés jusqu'à leur modification ou la suppression des données du navigateur.",
      "Les cookies déposés par le prestataire de paiement ont une durée limitée à la réalisation de la transaction et à la prévention de la fraude.",
    ],
  },
  {
    id: 'gestion',
    title: 'Gérer ou supprimer les cookies',
    paragraphs: [
      "Vous pouvez à tout moment supprimer les cookies et le stockage local depuis les réglages de votre navigateur, ou naviguer en mode privé. La suppression du cookie de session entraîne votre déconnexion.",
      "Le blocage de l'ensemble des cookies empêche l'utilisation du service, l'authentification reposant sur ces mécanismes.",
      "Les principaux navigateurs proposent une page d'aide dédiée : Chrome, Firefox, Safari, Edge.",
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    paragraphs: [
      `Pour toute question relative aux cookies et aux données personnelles : ${LEGAL.dpo}.`,
      "La politique de confidentialité détaille les finalités, les durées et vos droits sur vos données.",
    ],
  },
];

export default function Cookies() {
  return (
    <LegalPage
      kicker="Traceurs"
      title="Cookies et stockage local"
      description="Les cookies utilisés par le service, leur rôle, leur durée et la façon de les supprimer."
      sections={SECTIONS}
    />
  );
}