# Agora FST

Plateforme MERN de suivi des projets étudiants et des clubs universitaires.

Objectif: centraliser les projets, les événements, les membres, les rôles et les statistiques dans une seule application partagée par les étudiants, les clubs, les encadrants et l’administration.

## Contexte du projet

Aujourd’hui, les activités sont dispersées entre plusieurs canaux: WhatsApp, Facebook, e-mails, réunions informelles et documents séparés. Cette base de projet sert à poser une architecture claire pour une future plateforme qui permet de:

- créer et suivre des projets étudiants ou de clubs;
- gérer les membres, les rôles et les droits d’accès;
- publier des événements et suivre les inscriptions;
- consulter l’historique et les statistiques d’activité;
- préparer plus tard les notifications et les recommandations.

## Stack technique

- Frontend: React JS + Vite
- Backend: Node JS + Express
- Base de données: MongoDB Atlas
- ODM: Mongoose

## Fonctionnalités prévues

- Gestion des utilisateurs, clubs et rôles.
- Création de projets avec objectifs, échéances et progression.
- Gestion des tâches associées aux projets.
- Publication d’événements avec inscriptions.
- Suivi des participations et historique.
- Statistiques de base sur les projets et les clubs.
- Extensions possibles: notifications et recommandations.

## Arborescence du projet

```text
Agora FST/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── clubs.controller.js
│   │   │   ├── events.controller.js
│   │   │   ├── projects.controller.js
│   │   │   ├── stats.controller.js
│   │   │   └── users.controller.js
│   │   ├── middlewares/
│   │   │   ├── error.middleware.js
│   │   │   └── notFound.middleware.js
│   │   ├── models/
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── clubs.routes.js
│   │   │   ├── events.routes.js
│   │   │   ├── index.js
│   │   │   ├── projects.routes.js
│   │   │   ├── stats.routes.js
│   │   │   └── users.routes.js
│   │   ├── utils/
│   │   │   └── apiError.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Clubs.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── Students.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Schéma MongoDB

Le schéma de base est déjà prévu dans [backend/src/models/index.js](backend/src/models/index.js) avec les entités suivantes:

- Competence
- Utilisateur
- Club
- Projet
- Tache
- Evenement
- ParticipationEvenement

Relations principales:

- un utilisateur peut avoir des compétences;
- un club a des membres et un bureau exécutif;
- un projet appartient à un club et contient des étudiants et un enseignant encadrant;
- une tâche appartient à un projet;
- un événement appartient à un organisateur;
- une participation relie un utilisateur à un événement.

## Installation locale

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd "Agora FST"
```

### 2. Backend

```bash
cd backend
npm install
```

Créer ensuite un fichier `.env` à partir de `.env.example`.

Exemple:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
JWT_SECRET=change_this_secret
```

Lancer le backend:

```bash
npm run dev
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

## Scripts disponibles

Backend:

- `npm run dev`: démarre le serveur avec nodemon
- `npm start`: démarre le serveur en mode production

Frontend:

- `npm run dev`: lance Vite en mode développement
- `npm run build`: construit l’application pour production
- `npm run preview`: prévisualise le build localement

## Notes techniques

- Le backend expose des routes de base prêtes à être développées.
- Le frontend contient une navigation simple et des pages placeholder.
- MongoDB Atlas est prévu pour l’hébergement de la base de données.
- La structure est volontairement simple pour faciliter le travail en groupe.

## Roadmap rapide

- Ajouter l’authentification JWT.
- Séparer les modèles MongoDB en fichiers individuels si nécessaire.
- Brancher les formulaires React sur les routes API.
- Ajouter les tableaux de bord, filtres et graphiques.
- Intégrer les notifications et recommandations.

## Licence

Projet académique interne au groupe.
