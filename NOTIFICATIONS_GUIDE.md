# Push Notifications System

## Overview

Un système complet de notifications push a été implémenté pour l'application Agora-FST. Les notifications sont envoyées en temps réel via Socket.io et peuvent être récupérées via des appels API REST.

## Features

### Types de Notifications

1. **invitation_event** - Invitation à participer à un événement
2. **invitation_project** - Invitation à encadrer un projet
3. **invitation_accepted** - Notification quand un enseignant accepte une invitation
4. **invitation_refused** - Notification quand un enseignant refuse une invitation
5. **event_updated** - Notification de mise à jour d'événement
6. **project_updated** - Notification de mise à jour de projet

### Événements Qui Déclenchent les Notifications

#### Pour les Enseignants
- **Nouvelle invitation à un événement** → `invitation_event`
- **Nouvelle invitation à un projet** → `invitation_project`

#### Pour les Clubs
- **Enseignant accepte invitation événement** → `invitation_accepted`
- **Enseignant refuse invitation événement** → `invitation_refused`
- **Enseignant accepte invitation projet** → `invitation_accepted`
- **Enseignant refuse invitation projet** → `invitation_refused`

## Backend Implementation

### Modèle Notification

```javascript
{
  utilisateurId: ObjectId,        // Destinataire
  type: String,                   // Type de notification
  titre: String,                  // Titre court
  message: String,                // Message détaillé
  relatedId: ObjectId,            // ID de la ressource concernée
  relatedType: String,            // Type de ressource (event, project, invitation)
  lue: Boolean,                   // Lu ou non
  dateNotification: Date          // Date de création
}
```

### Service de Notifications

Le fichier `backend/src/services/notification.service.js` fournit les méthodes suivantes:

#### Création de Notifications

```javascript
// Créer une notification simple
await notificationService.createNotification(
  utilisateurId,
  type,
  titre,
  message,
  relatedId,
  relatedType
);

// Créer des notifications pour plusieurs utilisateurs
await notificationService.createNotificationBatch(
  [userId1, userId2],
  type,
  titre,
  message,
  relatedId,
  relatedType
);
```

#### Récupération de Notifications

```javascript
// Récupérer toutes les notifications
const { notifications, total } = await notificationService.getNotifications(
  utilisateurId,
  limit,
  skip
);

// Récupérer les notifications non lues
const unread = await notificationService.getUnreadNotifications(utilisateurId);

// Compter les notifications non lues
const count = await notificationService.countUnread(utilisateurId);
```

#### Gestion des Notifications

```javascript
// Marquer comme lue
await notificationService.markAsRead(notificationId, utilisateurId);

// Marquer toutes comme lues
await notificationService.markAllAsRead(utilisateurId);

// Supprimer
await notificationService.deleteNotification(notificationId, utilisateurId);
```

### Routes API

#### Endpoints

```
GET    /api/notifications                    - Récupérer toutes les notifications
GET    /api/notifications/unread             - Récupérer les notifications non lues
GET    /api/notifications/unread/count       - Nombre de notifications non lues
PATCH  /api/notifications/:notificationId/read - Marquer comme lue
PATCH  /api/notifications/read/all           - Marquer toutes comme lues
DELETE /api/notifications/:notificationId    - Supprimer une notification
```

### Socket.io Events

#### Server → Client

```javascript
socket.on('notification:new', (notification) => {
  // Nouvelle notification en temps réel
});
```

#### Client → Server

```javascript
socket.emit('join:user-room');     // Rejoindre la room de l'utilisateur
socket.emit('join:club-room', clubId); // Rejoindre la room du club
```

## Frontend Implementation

### Service de Notifications

Le fichier `frontend/src/services/notification.service.ts` fournit une classe `NotificationService` avec les méthodes suivantes:

```typescript
// Connexion Socket.io
notificationService.connect(token);

// Récupérer les notifications
await notificationService.getNotifications(limit, skip);
await notificationService.getUnreadNotifications();
await notificationService.getUnreadCount();

// Gérer les notifications
await notificationService.markAsRead(notificationId);
await notificationService.markAllAsRead();
await notificationService.deleteNotification(notificationId);

// S'abonner aux nouvelles notifications
const unsubscribe = notificationService.onNewNotification((notification) => {
  console.log('Nouvelle notification:', notification);
});
```

### Hook React: useNotifications

Le hook `frontend/src/hooks/useNotifications.ts` facilite l'intégration:

```typescript
const {
  notifications,      // Array de notifications
  unreadCount,        // Nombre de notifications non lues
  isLoading,          // État de chargement
  error,              // Message d'erreur si présent
  markAsRead,         // Marquer comme lue
  markAllAsRead,      // Marquer toutes comme lues
  deleteNotification  // Supprimer une notification
} = useNotifications();
```

### Composant NotificationBell

Le composant `frontend/src/components/NotificationBell.tsx` affiche:
- Badge avec nombre de notifications non lues
- Menu déroulant avec liste des notifications
- Options pour marquer comme lu/supprimer
- Timestamps formatés

Utilisation:

```tsx
import { NotificationBell } from '@/components/NotificationBell';

export function Navbar() {
  return (
    <div className="navbar">
      {/* ... autres éléments */}
      <NotificationBell />
    </div>
  );
}
```

## Integration Guide

### 1. Backend

Les notifications sont automatiquement envoyées lors de:
- Création d'invitation (événement ou projet)
- Réponse à une invitation

Code dans les contrôleurs:

```javascript
// Dans club-dashboard.controller.js
const notificationService = require('../services/notification.service');

await notificationService.createNotification(
  teacherId,
  'invitation_event',
  'Nouvelle invitation à un événement',
  `${clubName} vous invite à participer à l'événement "${event.nom}".`,
  event._id,
  'event'
);
```

### 2. Frontend

#### Installation des dépendances

```bash
cd frontend
npm install
```

Les dépendances requises:
- `socket.io-client`: ^4.7.2

#### Initialisation dans l'app

Ajouter le composant NotificationBell à la navbar:

```tsx
// Dans Navbar.tsx ou similaire
import { NotificationBell } from '@/components/NotificationBell';

export function Navbar() {
  return (
    <nav>
      {/* ... */}
      <NotificationBell />
    </nav>
  );
}
```

### 3. Socket.io Configuration

Les variables d'environnement requises:

**.env.local (Frontend)**
```
VITE_SOCKET_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000/api
```

**.env (Backend)**
```
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret
PORT=5000
```

## Real-time Notifications Flow

1. **Envoi**: Club invite un enseignant
   ```
   Club → POST /api/club-dashboard/events/:eventId/invite-teacher
   Backend crée InvitationEvenement
   Backend crée Notification
   Socket.io émet notification:new
   ```

2. **Réception**: Frontend reçoit la notification
   ```
   Socket.io émet 'notification:new'
   NotificationService callback déclenché
   État React mis à jour
   NotificationBell affiche nouvelle notification
   ```

3. **Interaction**: Enseignant répond
   ```
   Enseignant → PATCH /api/teacher-dashboard/event-invitations/:invitationId/respond
   Backend met à jour InvitationEvenement
   Backend crée notification pour le club
   Socket.io émet notification:new pour le club
   ```

## Example Usage

### Créer une notification personnalisée

```javascript
// backend
const notificationService = require('../services/notification.service');

// Pour un utilisateur
await notificationService.createNotification(
  userId,
  'custom_type',
  'Titre',
  'Message détaillé',
  resourceId,
  'resource_type'
);

// Pour plusieurs utilisateurs
await notificationService.createNotificationBatch(
  [userId1, userId2, userId3],
  'custom_type',
  'Titre',
  'Message détaillé',
  resourceId,
  'resource_type'
);
```

### Afficher les notifications dans un composant

```tsx
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationPanel() {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div>
      {notifications.map((notif) => (
        <div key={notif.id} className={notif.lue ? 'read' : 'unread'}>
          <h3>{notif.titre}</h3>
          <p>{notif.message}</p>
          {!notif.lue && (
            <button onClick={() => markAsRead(notif.id)}>
              Marquer comme lu
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Troubleshooting

### Socket.io connection fails

1. Vérifier que le serveur backend est en cours d'exécution
2. Vérifier les variables d'environnement `VITE_SOCKET_URL`
3. Vérifier les logs du navigateur (F12 → Console)
4. Vérifier les logs du serveur

### Notifications ne s'affichent pas

1. Vérifier que l'utilisateur est authentifié (token présent)
2. Vérifier que le composant NotificationBell est rendu
3. Vérifier que Socket.io est connecté: `notificationService.isSocketConnected()`
4. Vérifier les requêtes réseau (F12 → Network)

### CORS errors

Ajouter le domaine frontend à la liste CORS du backend:

```javascript
// app.js
app.use(cors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true
}));
```

## Performance Considerations

1. **Pagination**: Récupérer les notifications par page pour les anciennes
2. **Cleanup**: Supprimer les notifications après 30 jours
3. **Indexing**: Les indices MongoDB sont déjà configurés
4. **Batch operations**: Utiliser `createNotificationBatch` pour plusieurs utilisateurs

## Future Enhancements

- [ ] Catégorisation et filtrage des notifications
- [ ] Notifications par email
- [ ] Planification des notifications
- [ ] Préférences utilisateur (on/off par type)
- [ ] Notification sounds
- [ ] Web Push API intégration
