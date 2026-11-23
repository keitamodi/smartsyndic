import LegalPage from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

const SECTIONS = [
  {
    id: 'responsable',
    title: 'Responsable du traitement',
    paragraphs: [
      `La présente politique décrit les traitements de données personnelles réalisés dans le cadre du service ${LEGAL.product}.`,
      `Pour les données de compte et de navigation, le responsable de traitement est l'éditeur du service : ${LEGAL.editor}, ${LEGAL.address}.`,
      "Pour les données de copropriété (résidents, propriétaires, occupants, prestataires, lots, documents, finances), le responsable de traitement est le cabinet syndic qui utilise le service. L'éditeur agit alors en qualité de sous-traitant, sur instruction documentée du cabinet.",
    ],
  },
  {
    id: 'donnees',
    title: 'Données traitées',
    paragraphs: ['Le service traite les catégories de données suivantes :'],
    items: [
      "identification et contact : nom, prénom, adresse email, téléphone, adresse postale, fonction au sein de la copropriété ;",
      "données de compte : identifiants de connexion, rôle attribué, périmètre d'immeubles, journal des actions réalisées ;",
      "données de copropriété : immeubles, lots, tantièmes, appels de fonds, factures, paiements, contrats, demandes et interventions ;",
      "documents déposés dans l'espace documentaire (procès-verbaux, devis, factures, pièces techniques) ;",
      "messages échangés via la messagerie et contenus soumis à l'assistant IA ;",
      "données de facturation du cabinet : forfait souscrit, historique de paiement (les données de carte sont traitées par le prestataire de paiement).",
    ],
  },
  {
    id: 'finalites',
    title: 'Finalités et bases légales',
    paragraphs: ['Les données sont traitées pour les finalités suivantes :'],
    items: [
      "fournir le service et gérer les comptes et les accès (exécution du contrat) ;",
      "gérer la copropriété : appels de fonds, assemblées, demandes, interventions, contrats (exécution du contrat et obligations légales du syndic) ;",
      "envoyer les emails transactionnels liés à ces opérations (convocation, avis d'échéance, relance, invitation) ;",
      "assurer la sécurité, prévenir la fraude et journaliser les actions sensibles (intérêt légitime) ;",
      "répondre aux obligations comptables, fiscales et légales (obligation légale) ;",
      "améliorer le service et produire des statistiques agrégées (intérêt légitime, sans identification des personnes).",
    ],
  },
  {
    id: 'destinataires',
    title: 'Destinataires et sous-traitants',
    paragraphs: [
      "Les données sont accessibles aux utilisateurs autorisés du cabinet syndic, et aux personnes concernées pour leurs propres informations (lots, factures, demandes).",
      "Des prestataires techniques interviennent en qualité de sous-traitants, pour les seuls besoins du service :",
    ],
    items: [
      `hébergement applicatif, base de données et stockage des fichiers : ${LEGAL.host.name} ;`,
      "envoi des emails transactionnels : service d'emailing de la plateforme d'hébergement ;",
      "paiement en ligne des abonnements : Stripe Payments Europe ;",
      "recherche d'informations publiques sur les entreprises (annuaire des prestataires) : API publiques françaises et fournisseur de cartographie.",
    ],
  },
  {
    id: 'transferts',
    title: 'Transferts hors Union européenne',
    paragraphs: [
      "Certains prestataires peuvent être établis ou traiter des données en dehors de l'Union européenne. Dans ce cas, les transferts sont encadrés par les garanties prévues par le RGPD (clauses contractuelles types de la Commission européenne ou décision d'adéquation).",
      "Les échanges avec l'assistant IA sont transmis à un fournisseur de modèle d'intelligence artificielle pour produire la réponse demandée, sans être utilisés pour entraîner un modèle public.",
    ],
  },
  {
    id: 'durees',
    title: 'Durées de conservation',
    paragraphs: [
      "Les données de compte sont conservées pendant la durée d'utilisation du service, puis supprimées ou anonymisées après un délai technique de sauvegarde.",
      "Les documents comptables et pièces justificatives de la copropriété sont conservés conformément aux obligations légales applicables (dix ans à compter de la clôture de l'exercice).",
      "Le journal des actions est conservé le temps nécessaire au suivi et à la sécurité, puis purgé.",
      "Les conversations avec l'assistant IA suivent la durée de conservation configurée par le cabinet dans les paramètres (30, 90, 365 jours ou illimitée).",
    ],
  },
  {
    id: 'securite',
    title: 'Sécurité',
    paragraphs: [
      "L'accès au service est protégé par authentification. Les droits sont cloisonnés par espace syndic et par rôle : chaque enregistrement n'est visible que des personnes autorisées.",
      "Les fichiers déposés par les utilisateurs sont stockés de façon privée et consultés au moyen de liens signés à durée limitée. Les échanges avec le service sont chiffrés en transit.",
      "Les actions sensibles (invitations, suppressions, envois, changements de forfait) sont journalisées dans l'espace du cabinet.",
    ],
  },
  {
    id: 'droits',
    title: 'Vos droits',
    paragraphs: [
      "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données, ainsi que du droit de retirer votre consentement lorsqu'il constitue la base du traitement.",
      "Ces droits s'exercent auprès du cabinet syndic pour les données de copropriété, et auprès de l'éditeur pour les données de compte et de navigation.",
      `Pour toute demande : ${LEGAL.dpo}. Une réponse est apportée dans un délai d'un mois. En cas de désaccord, vous pouvez saisir la Commission nationale de l'informatique et des libertés (CNIL).`,
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies et stockage local',
    paragraphs: [
      "Le service utilise des cookies et un stockage local strictement nécessaires à l'authentification, à la sécurité et à la mémorisation de l'espace syndic sélectionné. Aucun traceur publicitaire n'est déposé.",
      "Le détail des cookies et les moyens de les supprimer sont décrits dans la page dédiée aux cookies.",
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    paragraphs: [
      `Éditeur : ${LEGAL.editor}, ${LEGAL.address}.`,
      `Référent protection des données : ${LEGAL.dpo}.`,
    ],
  },
];

export default function Confidentialite() {
  return (
    <LegalPage
      kicker="Données personnelles"
      title="Politique de confidentialité"
      description="Quelles données le service traite, pour quelles finalités, combien de temps et comment exercer vos droits."
      sections={SECTIONS}
    />
  );
}