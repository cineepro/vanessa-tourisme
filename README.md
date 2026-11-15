# Vanessa Tourisme

> **Vanessa, celle qui connaît le Bénin mieux que vous**

Plateforme web de découverte et de réservation des sites touristiques du Bénin, dotée de **Vanessa**, l'assistante virtuelle béninoise qui conseille le touriste avant son choix, répond à ses questions sur la culture locale et l'accompagne pendant tout son séjour.

Projet développé par **ASILLIA** (Cotonou, Bénin), en extension de l'assistante [Vanessa](https://github.com/cineepro/vanessa-api).

---

## Principes d'architecture

- **Un seul projet Appwrite, partagé avec Vanessa.** Même `projectId`, même base de données, même collection `users` : un compte créé sur Vanessa fonctionne ici, et inversement. Aucun doublon.
- **Les données tourisme sont isolées** dans des collections préfixées `tour_` (profil touriste, sites, guides, offres, réservations, etc.). La collection `users` n'est jamais modifiée.
- **Navigation libre, actions protégées.** Parcourir les sites, guides et articles ne demande pas de compte. Discuter avec Vanessa, réserver, gérer ses favoris et ses réservations demande de se connecter (email/mot de passe ou Google).
- **La clé de `vanessa-api` reste côté serveur.** Le chat passe par l'Appwrite Function `tour-chat`, qui ajoute le contexte tourisme avant d'appeler l'API.
- **Les actions sensibles passent par des Functions** (réservation, changement de statut, avis, paiement). Le prix et la capacité sont toujours calculés côté serveur.
- **Plusieurs agences possibles** (marque blanche) : chaque agence correspond à une Team Appwrite.

## Stack

| Couche | Technologie |
|---|---|
| Interface | React 18, TypeScript, Vite 5 |
| Style | Tailwind CSS 3 (palette du drapeau béninois), Bricolage Grotesque + Figtree |
| Routage / état | React Router 6, Zustand |
| Backend | Appwrite (Auth, Databases, Storage, Functions) |
| Cartes | MapLibre GL |
| Billets de réservation | jsPDF + qrcode |
| Emails | Resend (dans les Functions) |
| Hébergement | Netlify |

## Prérequis

- Node.js **20 ou plus**
- Le projet Appwrite de Vanessa, avec les collections `tour_*` et les buckets déjà créés
- Une clé API Appwrite (pour les scripts locaux uniquement)

## Installation

```bash
npm install
cp .env.example .env     # puis remplir les valeurs
npm run dev              # http://localhost:5173
```

## Configuration Appwrite (une seule fois)

1. **Plateformes Web** : dans la console Appwrite, *Overview > Integrations > Platforms*, ajoute `localhost` et le domaine de production de ce site. Sans cela, la connexion et Google OAuth sont refusés.
2. **Google OAuth** : le fournisseur Google est déjà activé pour Vanessa. Rien à changer côté Google Cloud, car l'URI de redirection est celle d'Appwrite.
3. **Sessions** : les comptes sont partagés, mais les sessions sont propres à chaque domaine. L'utilisateur se connecte une fois sur chaque site avec les mêmes identifiants.
4. **Functions** : déployer celles du dossier `functions/` et renseigner leurs variables (voir `.env.example`, section 3).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript puis build de production |
| `npm run preview` | Prévisualise le build |
| `npm run typecheck` | Vérification TypeScript seule |
| `npm run setup:appwrite` | Vérifie / crée collections, attributs, index et buckets |
| `npm run seed:demo` | Insère des sites, guides, offres et lieux de démonstration |

## Structure

```
├── functions/    Appwrite Functions (chat, réservation, avis, notifications...)
├── scripts/      Scripts d'installation et de démonstration
├── public/       Fichiers statiques
└── src/
    ├── config/       Variables d'environnement, IDs Appwrite, constantes
    ├── lib/          Client Appwrite, géolocalisation, formatage
    ├── types/        Types TypeScript des documents
    ├── services/     Accès aux données (un fichier par domaine)
    ├── store/        États globaux Zustand
    ├── hooks/        Hooks réutilisables
    ├── router/       Routes, routes protégées, routes par rôle
    ├── components/   Composants (layout, ui, auth, sites, guides, booking, chat, places...)
    └── pages/        Pages (public, auth, account, agency)
```

## Déploiement (Netlify)

1. Connecter le dépôt Git à Netlify.
2. Build : `npm run build`, dossier publié : `dist` (déjà défini dans `netlify.toml`).
3. Ajouter dans *Site settings > Environment variables* toutes les variables `VITE_*` de `.env.example`.
4. **Ne pas** ajouter `APPWRITE_API_KEY` dans Netlify : cette clé sert uniquement aux scripts locaux et aux Functions.
5. Ajouter le domaine Netlify (et le domaine personnalisé) dans les plateformes Web d'Appwrite.

## Sécurité

- Le fichier `.env` n'est jamais commité.
- Aucune clé secrète n'est préfixée `VITE_`.
- La géolocalisation n'est utilisée qu'avec le consentement explicite du touriste (`tour_profiles.shareLocation`).
- Les notes de santé du profil ne sont lisibles que par leur propriétaire.

## Licence

Projet propriétaire ASILLIA. Exploitation par les agences partenaires dans le cadre d'un accord de collaboration et de licence.
