# FST Agora - Admin Panel Documentation

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Backend - Routes API](#backend-routes-api)
3. [Frontend - Composants](#frontend-composants)
4. [Sécurité](#sécurité)
5. [Guide d'utilisation](#guide-dutilisation)
6. [Tests](#tests)

---

## Architecture

### Structure Générale

```
Admin Feature
├── Backend (Node.js + Express + MongoDB)
│   ├── Middlewares (authorization.middleware.js)
│   ├── Controllers (admin.controller.js)
│   ├── Routes (admin.routes.js)
│   └── Tests (admin.integration.test.js)
├── Frontend (React + TypeScript)
│   ├── Pages (AdminPanel.tsx)
│   ├── Components (Admin/)
│   ├── Services (admin.api.ts)
│   └── UI Components (shadcn/ui)
└── Models (Utilisateur, Projet, Tache, Evenement, ParticipationEvenement)
```

### Modèles de Données

#### Utilisateur (Existant - Augmenté)
```javascript
{
  nom, prenom, email, motDePasse,
  role: ['etudiant', 'enseignant', 'club', 'admin'],
  niveau, filiere, grade, avatarUrl, specialite,
  active: Boolean (default: true) // NOUVEAU
}
```

#### Projet (Existant)
```javascript
{
  titre, description, objectif,
  dateDebut, deadline,
  statut: ['en_cours', 'termine', 'annule', 'en_attente'],
  progression: Number (0-100),
  enseignantId, etudiantIds, clubId
}
```

#### Tache (Existant)
```javascript
{
  titre, description,
  deadline,
  statut: ['a_faire', 'en_cours', 'terminee'],
  projetId, etudiantIds
}
```

#### Evenement (Existant)
```javascript
{
  titre, description,
  date, lieu, capacite, participantsCount,
  type: ['conference', 'atelier', 'hackathon', 'sortie', 'autre'],
  organisateurId, clubId, coOrganizerClubIds
}
```

#### ParticipationEvenement (Existant)
```javascript
{
  evenementId, utilisateurId,
  dateInscription,
  statut: ['inscrit', 'confirme', 'annule', 'present'],
  commentaire
}
```

---

## Backend - Routes API

### Base URL
```
/api/admin
```

### Authentification & Autorisation
Toutes les routes nécessitent :
- Header `Authorization: Bearer <token>`
- Rôle utilisateur: **admin**

```javascript
// Middleware utilisé sur toutes les routes
router.use(authenticate);
router.use(isAdmin);
```

### Routes Disponibles

#### 📊 Dashboard

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/dashboard/stats` | Statistiques globales du système |

**Réponse exemple:**
```json
{
  "users": {
    "total": 150,
    "students": 120,
    "teachers": 20,
    "clubs": 5,
    "admins": 5
  },
  "projects": {
    "total": 25,
    "active": 10,
    "pending": 8,
    "completed": 5,
    "cancelled": 2,
    "averageProgress": 45
  },
  "events": {
    "total": 50,
    "upcoming": 15,
    "past": 35
  },
  "tasks": {
    "total": 200,
    "completed": 120,
    "inProgress": 50,
    "pending": 30
  },
  "recentProjects": [...],
  "upcomingEvents": [...]
}
```

#### 👥 Gestion des Utilisateurs

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users` | Liste paginée des utilisateurs |
| GET | `/users/:id` | Détails d'un utilisateur |
| PUT | `/users/:id/role` | Modifier le rôle d'un utilisateur |
| PUT | `/users/:id/disable` | Désactiver un compte |
| PUT | `/users/:id/enable` | Réactiver un compte |

**GET /users** - Paramètres Query
```
?page=1&limit=10&role=etudiant&search=john
```

**PUT /users/:id/role** - Body
```json
{
  "role": "enseignant"
}
```

#### 📂 Gestion des Projets

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/projects` | Liste paginée des projets |
| GET | `/projects/:id` | Détails d'un projet avec tâches |
| PUT | `/projects/:id` | Mettre à jour statut/progression |

**GET /projects** - Paramètres Query
```
?page=1&limit=10&statut=en_cours&search=titre
```

**PUT /projects/:id** - Body
```json
{
  "statut": "termine",
  "progression": 100
}
```

#### ✓ Gestion des Tâches

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/projects/:projectId/tasks` | Tâches d'un projet |
| PUT | `/tasks/:id` | Mettre à jour statut d'une tâche |

**PUT /tasks/:id** - Body
```json
{
  "statut": "terminee"
}
```

#### 📅 Gestion des Événements

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/events` | Liste paginée des événements |
| GET | `/events/:id` | Détails d'un événement + participants |
| PUT | `/events/:id` | Mettre à jour un événement |
| GET | `/events/:id/participants-stats` | Stats des participants |

**GET /events** - Paramètres Query
```
?page=1&limit=10&type=conference&search=titre
```

**PUT /events/:id** - Body
```json
{
  "titre": "Nouveau titre",
  "date": "2024-12-31T18:00:00Z",
  "capacite": 100
}
```

**Réponse participants-stats**
```json
{
  "total": 45,
  "registered": 40,
  "confirmed": 35,
  "cancelled": 5,
  "present": 30,
  "capacity": 100,
  "available": 55,
  "fillPercentage": 45
}
```

---

## Frontend - Composants

### Structure des Composants

```
pages/
  └── AdminPanel.tsx          # Page principale (routing)

components/Admin/
  ├── AdminSidebar.tsx        # Navigation latérale
  ├── AdminDashboard.tsx      # Tableau de bord
  ├── UserManagement.tsx      # Gestion des utilisateurs
  ├── ProjectManagement.tsx   # Gestion des projets
  ├── EventManagement.tsx     # Gestion des événements
  ├── ProjectDetailModal.tsx  # Modal détails projet
  └── EventDetailModal.tsx    # Modal détails événement

services/
  └── admin.api.ts            # Service API admin
```

### AdminPanel.tsx

Page principale du panel d'administration. Contient:
- Navigation par onglets
- Protection par rôle admin
- Sidebar de navigation

**Utilisation:**
```tsx
<Route path="/admin" element={<AdminPanel />} />
```

### AdminSidebar.tsx

Navigation latérale avec:
- Menu des sections
- Déconnexion

**Props:**
```typescript
interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
```

### AdminDashboard.tsx

Vue d'ensemble avec statistiques:
- Compteurs (utilisateurs, projets, événements)
- Graphiques de progression
- Projets récents
- Événements à venir

### UserManagement.tsx

Tableau des utilisateurs avec:
- Recherche et filtres
- Pagination
- Modification de rôle
- Désactivation de comptes

### ProjectManagement.tsx

Gestion des projets:
- Tableau avec progression
- Filtres par statut
- Modal de détails
- Édition de progression

### EventManagement.tsx

Gestion des événements:
- Tableau avec capacités
- Filtres par type
- Modal de détails
- Liste des participants

### Services - admin.api.ts

Encapsule tous les appels API admin:

```typescript
// Utilisation
import { adminAPI } from '@/services/admin.api';

// Dashboard
adminAPI.getDashboardStats()

// Utilisateurs
adminAPI.getAllUsers(page, limit, role, search)
adminAPI.updateUserRole(id, role)
adminAPI.disableUser(id)

// Projets
adminAPI.getAllProjects(page, limit, statut, search)
adminAPI.updateProject(id, { progression, statut })

// Événements
adminAPI.getAllEvents(page, limit, type, search)
adminAPI.getEventParticipantStats(id)
```

---

## Sécurité

### Authentification

1. **Vérification du Token JWT**
   - Middleware `authenticate` valide le token
   - Impossible d'accéder aux routes sans token valide

2. **Vérification du Rôle**
   - Middleware `isAdmin` vérifie que `user.role === 'admin'`
   - Seuls les admins peuvent accéder aux routes

### Protection côté Modèle

**Empêcher le retrait du dernier admin:**
```javascript
if (role !== 'admin') {
  const adminCount = await Utilisateur.countDocuments({ role: 'admin' });
  if (adminCount === 1) {
    throw new ApiError(400, 'Impossible de retirer le seul administrateur');
  }
}
```

**Empêcher l'auto-désactivation:**
```javascript
if (req.user._id.toString() === id) {
  throw new ApiError(400, 'Vous ne pouvez pas vous désactiver');
}
```

### Validation des Données

- Progression: 0-100
- Rôles: ['etudiant', 'enseignant', 'club', 'admin']
- Statuts de projet: ['en_cours', 'termine', 'annule', 'en_attente']
- Statuts de tâche: ['a_faire', 'en_cours', 'terminee']

---

## Guide d'Utilisation

### Installation & Démarrage

1. **Backend**
```bash
cd backend
npm install
# Ajouter les routes admin au app.js (déjà fait)
npm start
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Accès au Panel Admin

1. Se connecter avec un compte administrateur
2. Naviguer vers `/admin`
3. Utiliser le panel de contrôle

### Cas d'Utilisation

#### Changer le rôle d'un utilisateur
```
1. Aller à "Utilisateurs"
2. Cliquer sur l'icône Edit
3. Sélectionner le nouveau rôle
4. Confirmer
```

#### Consulter la progression d'un projet
```
1. Aller à "Projets"
2. Cliquer sur l'icône Eye pour voir les détails
3. Voir les tâches associées
4. Mettre à jour la progression
```

#### Gérer les participants d'un événement
```
1. Aller à "Événements"
2. Cliquer sur l'icône Eye
3. Voir la liste des participants avec statuts
4. Voir les statistiques de capacité
```

---

## Tests

### Fichier de Test
```
backend/tests/admin.integration.test.js
```

### Exécuter les Tests

```bash
cd backend
npm test -- admin.integration.test.js
```

### Tests Couverts

1. **Dashboard Stats**
   - ✓ Récupération des statistiques
   - ✓ Schéma correct

2. **User Management**
   - ✓ Mise à jour du rôle
   - ✓ Validation des rôles

3. **Project Management**
   - ✓ Calcul de progression
   - ✓ Validation progression (0-100)

4. **Task Management**
   - ✓ Création avec statut valide
   - ✓ Mise à jour du statut

5. **Event Management**
   - ✓ Calcul de capacité
   - ✓ Suivi des inscriptions

6. **Authorization Middleware**
   - ✓ Middlewares existent
   - ✓ Fonctions correctes

---

## Schémas d'Erreur

### 401 Unauthorized
```json
{
  "status": 401,
  "message": "Token manquant ou invalide"
}
```

### 403 Forbidden
```json
{
  "status": 403,
  "message": "Accès refusé. Seul un administrateur peut accéder à cette ressource."
}
```

### 404 Not Found
```json
{
  "status": 404,
  "message": "Utilisateur non trouvé"
}
```

### 400 Bad Request
```json
{
  "status": 400,
  "message": "La progression doit être entre 0 et 100"
}
```

---

## Améliorations Futures

1. **Audit Logging**
   - Tracer toutes les actions administrateur

2. **Bulk Operations**
   - Changer le rôle de plusieurs utilisateurs
   - Supprimer plusieurs projets

3. **Reports & Exports**
   - Exporter les statistiques en PDF/CSV
   - Génération de rapports

4. **Webhooks**
   - Notifier les admins d'événements
   - Intégrations externes

5. **2FA pour Admin**
   - Authentification à deux facteurs
   - Renforcer la sécurité

6. **Audit Trail**
   - Journal des modifications
   - Qui a modifié quoi et quand

---

## Support & Dépannage

### Erreur: "Accès refusé"
- Vérifier que vous êtes connecté
- Vérifier que votre rôle est "admin"
- Vérifier le token JWT

### Erreur: "Utilisateur non trouvé"
- Vérifier l'ID utilisateur
- Rafraîchir la liste

### Données non à jour
- Rafraîchir la page
- Vérifier la connexion réseau

---

**Dernière mise à jour:** 2024
**Version:** 1.0.0
