# Système de Demandes de Participation aux Projets

## Overview

Un système complet permettant aux **étudiants de demander** à participer à un **projet** et permettant aux **clubs de valider** ou **refuser** ces demandes avec notification en temps réel.

## Fonctionnalités

### Pour les Étudiants
✅ Demander de participer à un projet
✅ Ajouter un message optionnel avec la demande
✅ Voir l'historique de leurs demandes (en attente, acceptée, refusée)
✅ Recevoir une notification quand leur demande est traitée
✅ Empêché de faire plusieurs demandes au même projet

### Pour les Clubs
✅ Voir les demandes de participation pour leurs projets
✅ Accepter une demande → ajoute l'étudiant au projet
✅ Refuser une demande → l'étudiant reste informé
✅ Annuler une demande en attente
✅ Recevoir une notification quand un étudiant demande

## Modèle ProjectParticipationRequest

```javascript
{
  projetId: ObjectId,             // Référence au projet
  etudiantId: ObjectId,           // Référence à l'étudiant
  clubId: ObjectId,               // Référence au club (pour les notifications)
  statut: String,                 // 'en_attente' | 'accepte' | 'refuse'
  message: String,                // Message optionnel de l'étudiant
  dateRequete: Date,              // Date de la demande
  dateReponse: Date,              // Date de la réponse (null si en attente)
  timestamps: true                // createdAt, updatedAt
}
```

### Unique Index
- `{ projetId: 1, etudiantId: 1 }` - Une seule demande par étudiant par projet

### Indexes de Performance
- `{ etudiantId: 1, statut: 1 }` - Pour les requêtes de l'étudiant
- `{ clubId: 1, statut: 1 }` - Pour les requêtes du club

## Validation des Demandes

### Empêchement des Demandes Multiples

Une demande est refusée si:
1. L'étudiant est déjà participant au projet
2. Il existe déjà une demande en attente pour cet étudiant + projet
3. Il existe déjà une demande acceptée (l'étudiant participe)

Messages d'erreur spécifiques:
- "Vous participez déjà à ce projet"
- "Vous avez déjà une demande en attente pour ce projet"

## API Endpoints

### Pour les Étudiants

#### Demander de participer
```
POST /api/student/projects/:projectId/participation-request
Body: {
  message?: string
}

Response:
{
  success: true,
  data: {
    id: string,
    projetId: string,
    statut: 'en_attente',
    dateRequete: Date
  }
}
```

#### Voir ses demandes
```
GET /api/student/participation-requests

Response:
{
  success: true,
  data: {
    requests: [
      {
        id: string,
        projet: {
          id: string,
          titre: string,
          description: string,
          deadline: Date,
          statut: string
        },
        club: {
          id: string,
          nom: string
        },
        statut: 'en_attente' | 'accepte' | 'refuse',
        dateRequete: Date,
        dateReponse: Date | null
      }
    ]
  }
}
```

### Pour les Clubs

#### Voir les demandes du projet
```
GET /api/club-dashboard/projects/:projectId/participation-requests

Response:
{
  success: true,
  data: {
    requests: [
      {
        id: string,
        etudiant: {
          id: string,
          nom: string,
          prenom: string,
          email: string,
          niveau: string,
          filiere: string
        },
        statut: 'en_attente' | 'accepte' | 'refuse',
        message: string | null,
        dateRequete: Date,
        dateReponse: Date | null
      }
    ]
  }
}
```

#### Répondre à une demande
```
PATCH /api/club-dashboard/projects/:projectId/participation-requests/:requestId/respond
Body: {
  statut: 'accepte' | 'refuse'
}

Response:
{
  success: true,
  message: 'Demande acceptée' | 'Demande refusée',
  data: {
    id: string,
    statut: string,
    dateReponse: Date
  }
}
```

Si **statut = 'accepte'**:
- L'étudiant est ajouté à `projet.etudiantIds`
- Une notification est envoyée à l'étudiant

#### Annuler une demande en attente
```
DELETE /api/club-dashboard/projects/:projectId/participation-requests/:requestId

Response:
{
  success: true,
  message: 'Demande annulée'
}
```

Seules les demandes en attente peuvent être annulées.

## Notifications

### Types de Notifications

1. **participation_request** (pour le club)
   - Titre: "Demande de participation à un projet"
   - Message: "{Étudiant} a demandé à participer au projet \"{Titre}\""

2. **participation_approved** (pour l'étudiant)
   - Titre: "Réponse à votre demande de participation"
   - Message: "Votre demande de participation au projet \"{Titre}\" a été acceptée!"

3. **participation_rejected** (pour l'étudiant)
   - Titre: "Réponse à votre demande de participation"
   - Message: "Votre demande de participation au projet \"{Titre}\" a été refusée."

## Flux d'Utilisation

### 1. Étudiant Demande une Participation
```
Étudiant → POST /api/student/projects/:projectId/participation-request
         → Backend crée ProjectParticipationRequest(statut='en_attente')
         → Notification envoyée au club via Socket.io
         → Réponse avec ID de la demande
```

### 2. Club Accepte/Refuse
```
Club → PATCH /api/club-dashboard/projects/:projectId/participation-requests/:requestId/respond
     → Backend met à jour statut (accepte/refuse)
     → Si accepte: Ajoute l'étudiant au projet.etudiantIds
     → Notification envoyée à l'étudiant via Socket.io
     → Réponse confirmant l'action
```

## Contrôleurs

### backend/src/controllers/student.controller.js

```javascript
// Demander de participer
requestProjectParticipation(req, res, next)

// Voir ses demandes
getMyParticipationRequests(req, res, next)
```

### backend/src/controllers/club-dashboard.controller.js

```javascript
// Voir les demandes du projet
getProjectParticipationRequests(req, res, next)

// Accepter/Refuser une demande
respondToParticipationRequest(req, res, next)

// Annuler une demande en attente
cancelParticipationRequest(req, res, next)
```

## Routes

### Routes Étudiants (`/api/student`)

```
POST   /projects/:projectId/participation-request
GET    /participation-requests
```

Authentification requise: **etudiant**

### Routes Club (`/api/club-dashboard`)

```
GET    /projects/:projectId/participation-requests
PATCH  /projects/:projectId/participation-requests/:requestId/respond
DELETE /projects/:projectId/participation-requests/:requestId
```

Authentification requise: **club**

## Frontend

### Services

#### `frontend/src/services/participation-request.api.ts`

```typescript
// Pour les étudiants
requestProjectParticipation(projectId, message?)
getMyParticipationRequests()

// Pour les clubs
getProjectParticipationRequests(projectId)
respondToParticipationRequest(projectId, requestId, statut)
cancelParticipationRequest(projectId, requestId)
```

### Hooks

#### `frontend/src/hooks/useParticipationRequests.ts`

**useStudentParticipationRequests()**
```typescript
const {
  requests,              // ParticipationRequest[]
  isLoading,            // boolean
  error,                // string | null
  fetchMyRequests,      // () => Promise<void>
  requestParticipation  // (projectId, message?) => Promise<boolean>
} = useStudentParticipationRequests();
```

**useClubParticipationRequests()**
```typescript
const {
  requests,              // ParticipationRequest[]
  isLoading,            // boolean
  error,                // string | null
  fetchProjectRequests,  // (projectId) => Promise<void>
  respond,              // (projectId, requestId, statut) => Promise<boolean>
  cancel                // (projectId, requestId) => Promise<boolean>
} = useClubParticipationRequests();
```

## Exemples d'Utilisation

### Côté Étudiant

```tsx
import { useStudentParticipationRequests } from '@/hooks/useParticipationRequests';

export function StudentProjectView({ projectId }) {
  const { requestParticipation, isLoading, error } = useStudentParticipationRequests();

  const handleRequest = async () => {
    const message = "Je suis très intéressé par ce projet!";
    const success = await requestParticipation(projectId, message);
    if (success) {
      toast.success('Demande envoyée!');
    }
  };

  return (
    <div>
      <button onClick={handleRequest} disabled={isLoading}>
        {isLoading ? 'Envoi...' : 'Demander à Participer'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

### Côté Club

```tsx
import { useClubParticipationRequests } from '@/hooks/useParticipationRequests';

export function ProjectParticipationRequestsPanel({ projectId }) {
  const { requests, fetchProjectRequests, respond, isLoading } = useClubParticipationRequests();

  useEffect(() => {
    fetchProjectRequests(projectId);
  }, [projectId]);

  const handleAccept = async (requestId) => {
    const success = await respond(projectId, requestId, 'accepte');
    if (success) {
      toast.success('Demande acceptée!');
    }
  };

  const handleReject = async (requestId) => {
    const success = await respond(projectId, requestId, 'refuse');
    if (success) {
      toast.success('Demande refusée');
    }
  };

  return (
    <div>
      {requests.map((request) => (
        <div key={request.id} className="p-4 border rounded">
          <h3>{request.etudiant.prenom} {request.etudiant.nom}</h3>
          <p>{request.message}</p>
          {request.statut === 'en_attente' && (
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleAccept(request.id)}>
                Accepter
              </button>
              <button onClick={() => handleReject(request.id)}>
                Refuser
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Cas d'Erreur

### Demande Refusée

```json
{
  "success": false,
  "message": "Vous participez déjà à ce projet"
}
```

Codes HTTP:
- `400` - Validation échouée (déjà participant, demande existante, etc.)
- `404` - Projet/Demande introuvable
- `401` - Non authentifié
- `403` - Rôle insuffisant

## Limitations & Validations

1. **Une seule demande active par (étudiant, projet)**
   - Impossible d'avoir 2 demandes en_attente
   - Impossible d'avoir une demande acceptée (car l'étudiant serait déjà participant)

2. **Seules les demandes en attente peuvent être traitées**
   - Une demande acceptée/refusée ne peut pas être modifiée

3. **Suppression de demandes**
   - Seuls les clubs peuvent annuler
   - Seulement les demandes en_attente

## Performance

- Indices MongoDB optimisés pour les requêtes courantes
- Pagination possible (à implémenter si besoin)
- Notifications optimisées avec Socket.io

## Améliorations Futures

- [ ] Pagination des demandes
- [ ] Filtrage par statut
- [ ] Recherche par étudiant/projet
- [ ] Historique des demandes supprimées
- [ ] Limite de demandes par étudiant/période
- [ ] Communication directe entre club et étudiant
