import LegalPage from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

const SECTIONS = [
  {
    id: 'editeur',
    title: 'Éditeur du service',
    paragraphs: [
      `Le service ${LEGAL.product}, plateforme de gestion de copropriété en ligne, est édité par ${LEGAL.editor}, ${LEGAL.legalForm}.`,
      `Immatriculation : ${LEGAL.registration}. Numéro de TVA intracommunautaire : ${LEGAL.vat}.`,
      `Siège social : ${LEGAL.address}.`,
      `Contact : ${LEGAL.email}.`,
    ],
  },
  {
    id: 'publication',
    title: 'Directeur de la publication',
    paragraphs: [`Directeur de la publication : ${LEGAL.director}.`],
  },
  {
    id: 'hebergement',
    title: 'Hébergement',
    paragraphs: [
      `Le service est hébergé par ${LEGAL.host.name}, dont le siège est situé ${LEGAL.host.address}.`,
      `Site de l'hébergeur : ${LEGAL.host.site}.`,
      "L'hébergeur assure la mise à disposition technique de l'infrastructure, de la base de données et du stockage des fichiers. Il n'intervient pas sur le contenu saisi par les utilisateurs.",
    ],
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    paragraphs: [
      `L'ensemble des éléments du service (marque, interface, textes, illustrations, base de données, code) est protégé par le droit de la propriété intellectuelle et demeure la propriété exclusive de l'éditeur ou de ses partenaires.`,
      "Toute reproduction, représentation, adaptation ou exploitation, totale ou partielle, sans autorisation écrite préalable est interdite.",
      "Les données saisies par un cabinet syndic (immeubles, lots, résidents, documents, écritures) restent la propriété du cabinet et de la copropriété concernée. L'éditeur ne les utilise que pour fournir le service.",
    ],
  },
  {
    id: 'donnees',
    title: 'Données personnelles et cookies',
    paragraphs: [
      "Le traitement des données personnelles est décrit dans la politique de confidentialité, et l'usage des cookies dans la page dédiée. Ces deux documents font partie intégrante des présentes mentions.",
    ],
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité et liens externes',
    paragraphs: [
      "L'éditeur s'efforce d'assurer l'exactitude des informations publiées sur le site vitrine, sans pouvoir garantir l'absence d'erreur. Les informations présentées ne constituent pas un conseil juridique, comptable ou fiscal.",
      "Le service peut renvoyer vers des sites tiers (prestataires, annuaires d'entreprises, sources publiques). L'éditeur n'exerce aucun contrôle sur ces contenus et décline toute responsabilité à leur égard.",
      "Les obligations légales propres à la copropriété (convocations, tenue des assemblées, comptabilité, recouvrement) restent à la charge du syndic et des organes de la copropriété.",
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    paragraphs: [
      `Pour toute question relative au service ou à ce document : ${LEGAL.email}.`,
      `Pour les demandes relatives aux données personnelles : ${LEGAL.dpo}.`,
    ],
  },
];

export default function MentionsLegales() {
  return (
    <LegalPage
      kicker="Informations légales"
      title="Mentions légales"
      description="Identification de l'éditeur, de l'hébergeur et des règles d'usage du site et du service."
      sections={SECTIONS}
    />
  );
}