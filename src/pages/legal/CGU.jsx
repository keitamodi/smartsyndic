import LegalPage from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

const SECTIONS = [
  {
    id: 'objet',
    title: 'Objet',
    paragraphs: [
      `Les présentes conditions générales d'utilisation (les « CGU ») encadrent l'accès et l'utilisation de ${LEGAL.product}, plateforme en ligne de gestion de copropriété destinée aux syndics, à leur équipe, aux copropriétaires, propriétaires bailleurs, occupants et prestataires qu'ils invitent.`,
      "Le service permet notamment de gérer le patrimoine (immeubles, lots), les demandes et interventions, les contrats, les assemblées générales, la facturation des appels de fonds, la messagerie et l'assistance par intelligence artificielle.",
    ],
  },
  {
    id: 'acceptation',
    title: 'Acceptation des conditions',
    paragraphs: [
      "La création d'un espace syndic ou l'acceptation d'une invitation vaut acceptation pleine et entière des présentes CGU et de la politique de confidentialité.",
      "L'utilisateur qui n'accepte pas ces conditions doit renoncer à utiliser le service.",
      "L'éditeur peut modifier les CGU à tout moment. Les modifications substantielles sont notifiées dans l'application ; la poursuite de l'utilisation vaut acceptation de la version en vigueur.",
    ],
  },
  {
    id: 'comptes',
    title: 'Accès au service et comptes',
    paragraphs: [
      "L'accès est réservé aux personnes disposant d'un compte. Les comptes des membres (copropriétaires, propriétaires, occupants, techniciens) et des collaborateurs du cabinet sont créés sur invitation : aucune inscription libre n'est possible.",
      "Chaque utilisateur s'engage à fournir des informations exactes, à conserver la confidentialité de ses identifiants et à signaler sans délai toute utilisation non autorisée de son compte.",
      "Un compte est personnel. Le partage d'identifiants entre plusieurs personnes est interdit ; le cabinet veille à attribuer un compte à chaque collaborateur.",
    ],
  },
  {
    id: 'roles',
    title: 'Rôles et périmètre des accès',
    paragraphs: [
      "Les droits d'accès dépendent du rôle attribué par le cabinet syndic : administrateur du cabinet, gestionnaire, comptable, assistant, copropriétaire, propriétaire, occupant ou technicien.",
      "Le cabinet syndic est responsable de la définition de ces rôles, du périmètre par immeuble et de leur mise à jour lorsqu'un utilisateur change de fonction ou quitte la copropriété.",
      "Les données sont cloisonnées par espace syndic : un utilisateur ne voit que les enregistrements auxquels son rôle lui donne accès.",
    ],
  },
  {
    id: 'forfaits',
    title: 'Forfaits, facturation et paiement',
    paragraphs: [
      "Le service est proposé sous forme de forfaits mensuels par cabinet (Free, Starter, Pro, Expert), sans engagement de durée. Chaque forfait détermine le nombre d'immeubles et de lots gérés, le nombre de sièges d'équipe et l'enveloppe mensuelle de questions à l'assistant IA.",
      "Les accès portail des copropriétaires, propriétaires et techniciens invités sont inclus sans limite et ne consomment pas de siège d'équipe.",
      "Les montants sont indiqués hors taxes ; la TVA applicable est ajoutée lors du paiement. Le paiement en ligne est opéré par un prestataire de paiement externe (Stripe) : aucune donnée bancaire complète n'est stockée par l'éditeur.",
      "Le changement de forfait prend effet immédiatement pour les limites d'usage. En cas d'impayé, l'accès aux fonctionnalités du forfait concerné peut être suspendu après information du cabinet.",
    ],
  },
  {
    id: 'obligations',
    title: 'Obligations d’utilisation',
    paragraphs: ["L'utilisateur s'engage à utiliser le service conformément à sa destination et à la réglementation applicable. Il est notamment interdit de :"],
    items: [
      "saisir des contenus illicites, diffamatoires, discriminatoires ou portant atteinte à la vie privée d'un tiers ;",
      "tenter d'accéder à des données ou à des comptes auxquels l'utilisateur n'est pas autorisé ;",
      "extraire massivement les données, contourner les limites d'usage ou perturber le fonctionnement du service ;",
      "utiliser l'assistant IA pour produire des documents trompeurs ou faire passer une réponse automatisée pour une décision juridique définitive ;",
      "transmettre des données sensibles (santé, infractions) qui ne seraient pas nécessaires à la gestion de la copropriété.",
    ],
  },
  {
    id: 'donnees-copropriete',
    title: 'Données de la copropriété et responsabilités du syndic',
    paragraphs: [
      "Le cabinet syndic demeure responsable de traitement des données personnelles qu'il enregistre dans le service (résidents, propriétaires, prestataires). L'éditeur agit en qualité de sous-traitant pour ces données, dans les conditions décrites dans la politique de confidentialité.",
      "Le syndic garantit disposer d'une base légale pour collecter et utiliser ces informations, et informe les personnes concernées de leur présence dans l'outil.",
      "Les documents produits par le service (avis d'échéance, convocations, procès-verbaux, relances) sont des modèles d'aide à la gestion. Il appartient au syndic de les vérifier, de les valider et d'accomplir les formalités légales (notification, affichage, dépôt, conservation).",
      "L'envoi d'emails et les paiements en ligne reposent sur des prestataires externes. Un envoi peut échouer ou être refusé, notamment lorsque le destinataire ne dispose pas d'un compte actif ou lorsque le domaine d'expédition n'est pas encore configuré : le syndic doit vérifier les résultats d'envoi affichés dans l'application.",
    ],
  },
  {
    id: 'ia',
    title: 'Assistance par intelligence artificielle',
    paragraphs: [
      "L'assistant IA s'appuie sur les documents et données de l'espace syndic pour proposer des réponses, des synthèses et des courriers. Ses réponses peuvent comporter des erreurs ou des approximations et ne remplacent pas l'analyse d'un professionnel.",
      "Les réponses générées doivent être relues avant tout envoi à un copropriétaire ou un prestataire, et ne constituent ni un conseil juridique ni une décision d'assemblée.",
      "La consommation de questions IA est décomptée par forfait et se réinitialise chaque mois.",
    ],
  },
  {
    id: 'disponibilite',
    title: 'Disponibilité et maintenance',
    paragraphs: [
      "L'éditeur met en œuvre les moyens raisonnables pour assurer la disponibilité du service, sans garantie d'absence d'interruption. Des maintenances, mises à jour ou incidents chez les hébergeurs et prestataires peuvent entraîner une indisponibilité temporaire.",
      "L'éditeur peut faire évoluer les fonctionnalités, en supprimer ou en ajouter, sous réserve d'en informer les cabinets et de ne pas réduire les limites souscrites en cours de période payée.",
    ],
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    paragraphs: [
      "Le service, sa marque, son interface et son code sont la propriété exclusive de l'éditeur. L'utilisateur bénéficie d'un droit d'usage non exclusif, non cessible et limité à la durée de son abonnement.",
      "Les données et documents importés ou créés par le cabinet restent sa propriété. À la clôture du compte, il peut en demander l'export dans les formats proposés par le service.",
    ],
  },
  {
    id: 'resiliation',
    title: 'Suspension et résiliation',
    paragraphs: [
      "L'éditeur peut suspendre un accès en cas de manquement grave aux CGU, d'impayé ou d'utilisation mettant en danger la sécurité du service, après information du cabinet sauf urgence caractérisée.",
      "Le cabinet peut supprimer son espace à tout moment. La suppression entraîne la perte des données hébergées après un délai de rétention technique ; il appartient au cabinet d'exporter ses données au préalable.",
      "Les comptes invités cessent d'être actifs lorsque le cabinet les désactive ou supprime l'espace auquel ils sont rattachés.",
    ],
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité',
    paragraphs: [
      "La responsabilité de l'éditeur ne peut être engagée qu'en cas de faute prouvée et est limitée aux dommages directs et prévisibles. Elle ne couvre pas les pertes d'exploitation, de données ou d'image résultant d'un usage non conforme du service.",
      "L'utilisateur est responsable des informations qu'il saisit, des messages qu'il envoie depuis le service et de l'usage qu'il fait des documents générés.",
    ],
  },
  {
    id: 'droit',
    title: 'Droit applicable et litiges',
    paragraphs: [
      "Les présentes CGU sont soumises au droit français. En cas de litige, les parties rechercheront une solution amiable avant toute action ; à défaut, les tribunaux français seront compétents.",
      "Les consommateurs peuvent recourir gratuitement à un médiateur de la consommation dans les conditions prévues par le code de la consommation.",
    ],
  },
];

export default function CGU() {
  return (
    <LegalPage
      kicker="Conditions générales"
      title="Conditions générales d’utilisation"
      description="Les règles d'accès et d'usage du service par les syndics, leur équipe et les personnes qu'ils invitent."
      sections={SECTIONS}
    />
  );
}