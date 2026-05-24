# Project Tasks API

## Objectif

Ce module permet au club créateur d'un projet de gérer les rôles et tâches des participants, et aux étudiants de suivre leurs tâches.

## Permissions

- Club créateur du projet: créer, modifier, supprimer des tâches et assigner des rôles.
- Étudiant assigné: modifier uniquement le `status` de ses propres tâches.
- Une tâche ne peut être assignée qu'à un étudiant déjà présent dans `project.etudiantIds`.

## Routes

### POST `/api/project-tasks`

Crée une tâche pour un participant du projet.

```json
{
  "projectId": "665f...",
  "assignedTo": "665a...",
  "title": "Préparer la maquette",
  "description": "Créer les écrans principaux",
  "role": "UI/UX",
  "priority": "high",
  "status": "todo",
  "dueDate": "2026-06-15"
}
```

Réponse:

```json
{
  "success": true,
  "data": {
    "task": {
      "id": "6660...",
      "projectId": "665f...",
      "title": "Préparer la maquette",
      "role": "UI/UX",
      "priority": "high",
      "status": "todo",
      "assignedTo": {
        "id": "665a...",
        "nom": "Ben Ali",
        "prenom": "Amira",
        "email": "amira@example.com"
      }
    }
  }
}
```

### GET `/api/project-tasks/project/:projectId`

Retourne les participants, tâches et statistiques du projet.

```json
{
  "success": true,
  "data": {
    "project": { "id": "665f...", "titre": "Agora Mobile" },
    "participants": [],
    "stats": {
      "totalTasks": 4,
      "completedTasks": 2,
      "inProgressTasks": 1,
      "blockedTasks": 0,
      "todoTasks": 1,
      "remainingTasks": 2,
      "progressPercentage": 50
    },
    "tasks": []
  }
}
```

### PATCH `/api/project-tasks/:id`

Modifie une tâche. Réservé au club créateur du projet.

### DELETE `/api/project-tasks/:id`

Supprime une tâche. Réservé au club créateur du projet.

### PATCH `/api/project-tasks/:id/status`

Modifie uniquement le statut d'une tâche assignée à l'étudiant connecté.

```json
{
  "status": "completed"
}
```

### GET `/api/project-tasks/me`

Retourne toutes les tâches assignées à l'étudiant connecté.

### GET `/api/projects/my-participations`

Retourne les projets auxquels l'étudiant participe avec ses tâches et l'avancement.

### GET `/api/projects/:id/progress`

Retourne les statistiques d'avancement d'un projet.
