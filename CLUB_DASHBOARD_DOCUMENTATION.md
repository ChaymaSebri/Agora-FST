# 🎯 Dashboard Club - Documentation Complète

## 📋 Vue d'ensemble

Le Dashboard Club est une interface complète permettant aux représentants des clubs de gérer:
- **Profil du club** - Informations et détails du club
- **Événements** - Création, modification, suppression d'événements
- **Validations** - Confirmation ou refus des inscriptions aux événements
- **Projets** - Gestion complète des projets (CRUD)
- **Participants** - Gestion des participants et des rôles dans les projets

## 🚀 Accès au Dashboard

### Pour les représentants de club:
1. Se connecter avec un compte ayant le rôle `club`
2. Cliquer sur l'icône de profil en haut à droite
3. Cliquer sur "Dashboard Club"

Ou accéder directement via: `http://localhost:5173/club-dashboard`

---

## 📱 Onglets du Dashboard

### 1️⃣ **Profil du Club**

#### Fonctionnalités:
- **Visualiser le profil** du club
- **Modifier les informations**:
  - Nom du club
  - Description
  - Spécialité
- **Voir le bureau exécutif**
- **Liste des membres** du club

#### Workflow:
```
1. Cliquer sur "Profil"
2. Voir les informations actuelles
3. Cliquer sur "Modifier"
4. Éditer les champs
5. Cliquer sur "Enregistrer"
```

---

### 2️⃣ **Gestion des Événements**

#### Créer un événement:
```
1. Cliquer sur l'onglet "Événements"
2. Cliquer sur "+ Nouvel Événement"
3. Remplir le formulaire:
   - Titre (obligatoire)
   - Description
   - Date et heure (obligatoire)
   - Type (Conférence, Atelier, Hackathon, Sortie, Autre)
   - Lieu
   - Capacité (nombre de places)
4. Cliquer sur "Enregistrer"
```

#### Modifier un événement:
```
1. Dans la liste des événements
2. Cliquer sur "Modifier" sur l'événement
3. Mettre à jour les champs
4. Cliquer sur "Enregistrer"
```

#### Supprimer un événement:
```
1. Cliquer sur "Supprimer"
2. Confirmer la suppression
⚠️ Cette action supprimera aussi toutes les participations associées
```

#### Détails affichés pour chaque événement:
- Titre et description
- Date et heure formatées
- Lieu
- Nombre de participants / capacité
- Type d'événement

---

### 3️⃣ **Validations des Inscriptions**

#### Gérer les participations:
```
1. Cliquer sur "Validations"
2. Sélectionner un événement dans la liste
3. Voir tous les inscrits avec leur statut:
   - Inscrit (en attente)
   - Confirmé
   - Annulé
   - Présent
```

#### Confirmer une inscription:
```
1. Trouver la participation en statut "Inscrit"
2. Cliquer sur "Confirmer"
3. Le statut passe à "Confirmé"
```

#### Refuser une inscription:
```
1. Cliquer sur "Refuser"
2. Le statut passe à "Annulé"
```

#### Inviter un enseignant:
```
1. Cliquer sur "+ Inviter un enseignant"
2. Entrer l'ID de l'enseignant
3. Cliquer sur "Inviter"
4. L'enseignant reçoit le statut "Confirmé"
```

#### Informations affichées:
- Nom et email du participant
- Niveau et filière (pour les étudiants)
- Date d'inscription
- Statut actuel

---

### 4️⃣ **Gestion des Projets**

#### Créer un projet:
```
1. Cliquer sur l'onglet "Projets"
2. Cliquer sur "+ Nouveau Projet"
3. Remplir le formulaire:
   - Titre (obligatoire)
   - Description
   - Objectif
   - Date de début
   - Deadline (obligatoire)
   - Encadrant (ID de l'enseignant, optionnel)
   - Statut (En attente, En cours, Terminé, Annulé)
   - Progression (%)
4. Cliquer sur "Enregistrer"
```

#### Modifier un projet:
```
1. Cliquer sur "Modifier"
2. Mettre à jour les informations
3. Cliquer sur "Enregistrer"
```

#### Supprimer un projet:
```
1. Cliquer sur "Supprimer"
2. Confirmer la suppression
⚠️ Les tâches associées seront aussi supprimées
```

#### Détails affichés pour chaque projet:
- Titre et description
- Barre de progression (couleur en fonction du %)
- Statut actuel
- Encadrant responsable
- Deadline
- Nombre de participants

---

### 5️⃣ **Gestion des Participants et Rôles**

#### Ajouter un participant:
```
1. Cliquer sur "Participants"
2. Sélectionner un projet
3. Cliquer sur "+ Ajouter un participant"
4. Entrer l'ID de l'étudiant
5. Cliquer sur "Ajouter"
```

#### Retirer un participant:
```
1. Dans la liste des participants
2. Cliquer sur "Supprimer"
3. Confirmer la suppression
```

#### Inviter un encadrant (enseignant):
```
1. Cliquer sur "Inviter un encadrant"
2. Entrer l'ID de l'enseignant
3. Cliquer sur "Inviter"
4. L'enseignant devient co-encadrant du projet
```

#### Rôles dans les projets:
- **Encadrant**: Enseignant responsable du projet
- **Participant**: Étudiant travaillant sur le projet

---

## 🔌 Endpoints API

### Profil du Club
```
GET    /api/club-dashboard/profile
PATCH  /api/club-dashboard/profile
```

### Événements
```
GET    /api/club-dashboard/events
POST   /api/club-dashboard/events
PATCH  /api/club-dashboard/events/:id
DELETE /api/club-dashboard/events/:id
```

### Participations aux Événements
```
GET    /api/club-dashboard/events/:eventId/participations
PATCH  /api/club-dashboard/events/:eventId/participations/:participationId
POST   /api/club-dashboard/events/:eventId/invite-teacher
```

### Projets
```
GET    /api/club-dashboard/projects
POST   /api/club-dashboard/projects
PATCH  /api/club-dashboard/projects/:projectId
DELETE /api/club-dashboard/projects/:projectId
```

### Participants aux Projets
```
GET    /api/club-dashboard/projects/:projectId/participants
POST   /api/club-dashboard/projects/:projectId/participants
DELETE /api/club-dashboard/projects/:projectId/participants/:utilisateurId
POST   /api/club-dashboard/projects/:projectId/invite-teacher
```

---

## 📊 Statuts et États

### Statuts des Participations aux Événements
| Statut | Description |
|--------|-------------|
| `inscrit` | En attente de validation |
| `confirme` | Confirmé par le club |
| `annule` | Refusé ou annulé |
| `present` | Marqué comme présent |

### Statuts des Projets
| Statut | Description |
|--------|-------------|
| `en_attente` | En attente de démarrage |
| `en_cours` | Actuellement en cours |
| `termine` | Projet terminé |
| `annule` | Projet annulé |

### Types d'Événements
| Type | Description |
|------|-------------|
| `conference` | Conférence |
| `atelier` | Atelier pratique |
| `hackathon` | Hackathon |
| `sortie` | Sortie/Excursion |
| `autre` | Autre type d'événement |

---

## ⚙️ Configuration

### Rôles Requis
- Le dashboard est accessible uniquement pour les utilisateurs avec le rôle `club`
- Si vous n'êtes pas enregistré comme club, vous ne pouvez pas accéder au dashboard

### Permissions
- Les clubs ne peuvent gérer que leurs propres événements et projets
- Seuls les représentants du club peuvent faire des modifications

---

## 🐛 Dépannage

### Je ne vois pas le lien "Dashboard Club"
**Cause**: Vous n'êtes pas connecté avec un compte club
**Solution**: 
1. Déconnectez-vous
2. Reconnectez-vous avec un compte ayant le rôle `club`

### J'ai une erreur lors de la création d'un événement
**Cause**: Certains champs obligatoires sont manquants
**Solution**: Assurez-vous de remplir:
- ✅ Titre
- ✅ Date et heure

### Impossible d'inviter un enseignant
**Cause**: L'ID de l'enseignant n'existe pas ou n'est pas un enseignant
**Solution**:
1. Vérifier l'ID de l'enseignant
2. Vérifier que c'est bien un compte enseignant

---

## 📝 Bonnes Pratiques

1. **Mettez à jour régulièrement** votre profil de club
2. **Validez rapidement** les inscriptions aux événements
3. **Définissez des deadlines réalistes** pour vos projets
4. **Communiquez clairement** les objectifs des projets
5. **Mettez à jour la progression** des projets régulièrement

---

## 🎓 Cas d'Usage Typiques

### Cas 1: Organisation d'un atelier
```
1. Créer un nouvel événement (type: Atelier)
2. Définir la date, l'heure et le nombre de places
3. Inviter un enseignant à participer (si nécessaire)
4. À mesure que les inscriptions arrivent, les valider
5. Marquer les participants comme "présents" après l'événement
```

### Cas 2: Lancement d'un projet
```
1. Créer un nouveau projet
2. Définir la deadline et les objectifs
3. Ajouter un enseignant encadrant
4. Ajouter les participants (étudiants)
5. Mettre à jour la progression régulièrement
6. Marquer comme "terminé" à la fin
```

### Cas 3: Gestion d'un club multi-événements
```
1. Créer plusieurs événements sur le calendrier
2. Pour chaque événement, gérer les participations
3. Générer un rapport de validation
4. Envoyer des confirmations aux participants
```

---

## 📞 Support

Pour toute question ou problème:
1. Vérifiez cette documentation
2. Contactez votre administrateur système
3. Vérifiez les logs du serveur pour les erreurs détaillées

---

**Dernière mise à jour**: Mai 2026
**Version**: 1.0
