# SyndicVibe — Inventaire & durcissement de la sécurité

Dernière mise à jour : 16/11/2026

## 1. Vue d'ensemble

| Élément | Volume |
| --- | --- |
| Entités (tables) | 26 + `User` (plateforme) |
| Fonctions serveur | 5 |
| Pages applicatives protégées | 19 (toutes derrière l'authentification) |
| Pages publiques | Accueil, Connexion, Inscription, Mot de passe oublié / réinitialisation, MFA, 404 |

Aucune donnée métier n'est accessible sans être connecté.

## 2. Rôles

| Rôle | Qui | Ce qu'il voit |
| --- | --- | --- |
| `admin` | Le cabinet de syndic (compte fondateur + collaborateurs invités) | Toutes les données de son espace, toutes les actions |
| `user` | Compte connecté non rattaché au cabinet | Uniquement les enregistrements qu'il a lui-même créés, plus ses propres dossiers (voir §3) |
| public | Visiteur non connecté | Uniquement les pages de présentation et le formulaire de demande d'inscription |

Le module **Paramètres › Accès** (niveaux copropriétaire / propriétaire / technicien / équipe) reste un
réglage d'affichage : il ne remplace pas les règles ci-dessous, qui sont appliquées par la base de données.

## 3. Matrice des accès aux données

Légende : **A** = administrateur, **P** = auteur de l'enregistrement, **E** = même e-mail que le champ indiqué.

| Entité | Lecture | Création | Modification / Suppression |
| --- | --- | --- | --- |
| Syndic | A + P | A, connecté | P ou A |
| SyndicSettings | A + P | A, connecté | P ou A |
| TeamMember | A + P + E (*email*) | A, connecté | P ou A |
| Building | A + P | A, connecté | P ou A |
| Lot | A + P + E (*owner\_email*) | A, connecté | P ou A |
| Resident | A + P + E (*email*) | A, connecté | P ou A |
| Provider | A + P + E (*email*) | A, connecté | P ou A |
| PartnerCompany | A + P | A, connecté | P ou A |
| Ticket | A + P + E (*requester\_email*) | A, connecté | P ou A |
| Intervention | A + P | A, connecté | P ou A |
| Appointment | A + P | A, connecté | P ou A |
| Contract | A + P | A, connecté | P ou A |
| Assembly | A + P | A, connecté | P ou A |
| Resolution | A + P | A, connecté | P ou A |
| Document | A + P | A, connecté | P ou A |
| QuoteRequest | A + P | A, connecté | P ou A |
| QuoteInvite | A + P | A, connecté | P ou A |
| QuoteOffer | A + P | A, connecté | P ou A |
| Invoice | A + P + E (*recipient\_email*) | A, connecté | P ou A |
| Payment | A + P | A, connecté | P ou A |
| Notification | A + P | A, connecté | P ou A |
| Thread | A + P + E (*contact\_email*) | A, connecté | P ou A |
| ThreadMessage | A + P | A, connecté | P ou A |
| Conversation | A + P | A, connecté | P ou A |
| Message | A + P | A, connecté | P ou A |
| AuditLog | A + P | A, connecté | P ou A |
| SignupRequest | A uniquement | public (formulaire) | A uniquement |

Points clés :

- **Aucune lecture publique** sur les données métier : un visiteur non connecté n'obtient rien.
- Un compte `user` ne voit jamais les données d'un autre compte, même dans le même cabinet.
- Les avis et notes Google des partenaires (`PartnerCompany`) ne sont visibles que du cabinet.

## 4. Fonctions serveur

| Fonction | Accès | Notes |
| --- | --- | --- |
| `agentIA` | connecté + appartenance à l'espace syndic | Vérifie `syndic_id` avant tout appel au modèle |
| `sendQuoteRequest` | connecté + appartenance à l'espace syndic | Envoi d'e-mails aux entreprises de devis |
| `interventionReminders` | administrateur + espace syndic | Génère rappels et alertes, protégé contre les doublons |
| `companySearch` | connecté | Recherche d'entreprises (API publique) |
| `companyLookup` | connecté | Fiche entreprise + avis Google (clé `GOOGLE_PLACES_API_KEY`) |

Le contrôle d'appartenance est centralisé dans `base44/shared/workspaceAccess.ts`, utilisé par toutes
les fonctions qui manipulent des données d'un espace syndic.

## 5. Corrections apportées lors de cet audit

1. Lecture des entités : le rôle générique `user` pouvait lire **toutes** les données du cabinet.
   Remplacé par « administrateur, auteur, ou même e-mail » — 22 entités corrigées.
2. `TeamMember`, `Resident`, `Provider`, `Lot`, `Thread`, `Ticket`, `Invoice` : un résident connecté
   retrouve désormais ses propres dossiers grâce à la correspondance d'e-mail.
3. Contrôle d'appartenance ajouté aux fonctions `agentIA`, `sendQuoteRequest` et `interventionReminders`.
4. Invitation d'un collaborateur : le compte invité reçoit le rôle `admin` (sans quoi la personne
   invitée n'aurait accès à aucune donnée du cabinet).
5. Documents, devis et pièces jointes : stockage privé, accès par lien signé uniquement.

## 6. Points de vigilance

- **Un seul rôle applicatif « administrateur »** : tous les membres du cabinet ont les mêmes pouvoirs
  (y compris la gestion des utilisateurs). Les fonctions « directeur / gestionnaire / assistant »
  du module Équipe sont descriptives ; pour des droits réellement différenciés, il faudra un champ
  de rôle métier dédié appliqué par les règles de la base.
- **Copropriétaires** : ils accèdent aujourd'hui à leur espace par correspondance d'e-mail sur les
  lots, appels de fonds et tickets. Aucun compte de ce type n'existe encore pour tester ce chemin.
- **Mots de passe** : la réinitialisation et la double authentification sont gérées par la plateforme ;
  activer la MFA est recommandé pour les comptes administrateurs (Paramètres du compte).
- **Sauvegardes / export** : pas encore d'export complet des données d'un espace.
