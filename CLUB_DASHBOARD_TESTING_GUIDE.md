# 🧪 Guide de Test - Dashboard Club

## ⚙️ Configuration Préalable

### 1. Démarrage du Backend
```bash
cd backend
npm install
npm run dev
# Le serveur devrait démarrer sur http://localhost:3000
```

### 2. Démarrage du Frontend
```bash
cd frontend
npm install
npm run dev
# L'app devrait être disponible sur http://localhost:5173
```

### 3. Base de Données
```bash
# Vérifier que MongoDB est en cours d'exécution
# Les modèles doivent être créés: Utilisateur, Club, Evenement, Projet
```

---

## 👤 Créer un Compte Test Club

### Via l'API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "club@example.com",
    "motDePasse": "Password123!",
    "role": "club",
    "clubId": "VALID_CLUB_ID"
  }'
```

### Via l'Interface:
1. Accéder à `http://localhost:5173/auth`
2. S'inscrire avec un compte club (si le rôle est disponible)

---

## 🔐 Authentification Test

### Récupérer un Token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "club@example.com",
    "motDePasse": "Password123!"
  }'

# Réponse:
# {
#   "success": true,
#   "token": "YOUR_JWT_TOKEN",
#   "user": { ... }
# }
```

### Sauvegarder le Token:
```bash
export TOKEN="YOUR_JWT_TOKEN"
```

---

## 📋 Tests des Endpoints - Profil Club

### Récupérer le Profil:
```bash
curl http://localhost:3000/api/club-dashboard/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse Attendue:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "nom": "Nom du Club",
    "description": "Description",
    "specialite": "Spécialité",
    "statut": "actif",
    "membres": [],
    "membresCount": 0
  }
}
```

### Mettre à Jour le Profil:
```bash
curl -X PATCH http://localhost:3000/api/club-dashboard/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Nouveau Nom",
    "description": "Nouvelle description",
    "specialite": "Nouvelle spécialité"
  }'
```

---

## 📊 Tests des Statistiques

### Récupérer les Stats:
```bash
curl http://localhost:3000/api/club-dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse Attendue:**
```json
{
  "success": true,
  "data": {
    "eventsCount": 5,
    "projectsCount": 3,
    "activeParticipations": 25,
    "totalProjectParticipants": 15,
    "validationRate": 80
  }
}
```

---

## 🎉 Tests des Événements

### Créer un Événement:
```bash
curl -X POST http://localhost:3000/api/club-dashboard/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Mon Événement",
    "description": "Description de l'\''événement",
    "date": "2026-06-15T14:00:00Z",
    "lieu": "Salle A",
    "capacite": 50,
    "type": "atelier"
  }'
```

### Lister les Événements:
```bash
curl http://localhost:3000/api/club-dashboard/events \
  -H "Authorization: Bearer $TOKEN"
```

### Modifier un Événement:
```bash
curl -X PATCH http://localhost:3000/api/club-dashboard/events/EVENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Titre modifié",
    "description": "Nouvelle description"
  }'
```

### Supprimer un Événement:
```bash
curl -X DELETE http://localhost:3000/api/club-dashboard/events/EVENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 Tests des Participations aux Événements

### Lister les Participations:
```bash
curl http://localhost:3000/api/club-dashboard/events/EVENT_ID/participations \
  -H "Authorization: Bearer $TOKEN"
```

### Valider une Participation:
```bash
curl -X PATCH http://localhost:3000/api/club-dashboard/events/EVENT_ID/participations/PARTICIPATION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "statut": "confirme" }'
```

### Refuser une Participation:
```bash
curl -X PATCH http://localhost:3000/api/club-dashboard/events/EVENT_ID/participations/PARTICIPATION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "statut": "annule" }'
```

### Inviter un Enseignant:
```bash
curl -X POST http://localhost:3000/api/club-dashboard/events/EVENT_ID/invite-teacher \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "teacherId": "TEACHER_ID" }'
```

---

## 📚 Tests des Projets

### Créer un Projet:
```bash
curl -X POST http://localhost:3000/api/club-dashboard/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Mon Projet",
    "description": "Description du projet",
    "objectif": "Objectif du projet",
    "dateDebut": "2026-05-01T00:00:00Z",
    "deadline": "2026-12-31T23:59:59Z",
    "enseignantId": "TEACHER_ID"
  }'
```

### Lister les Projets:
```bash
curl http://localhost:3000/api/club-dashboard/projects \
  -H "Authorization: Bearer $TOKEN"
```

### Modifier un Projet:
```bash
curl -X PATCH http://localhost:3000/api/club-dashboard/projects/PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "en_cours",
    "progression": 50
  }'
```

### Supprimer un Projet:
```bash
curl -X DELETE http://localhost:3000/api/club-dashboard/projects/PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👨‍🎓 Tests des Participants aux Projets

### Lister les Participants:
```bash
curl http://localhost:3000/api/club-dashboard/projects/PROJECT_ID/participants \
  -H "Authorization: Bearer $TOKEN"
```

### Ajouter un Participant:
```bash
curl -X POST http://localhost:3000/api/club-dashboard/projects/PROJECT_ID/participants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "utilisateurId": "STUDENT_ID" }'
```

### Retirer un Participant:
```bash
curl -X DELETE http://localhost:3000/api/club-dashboard/projects/PROJECT_ID/participants/STUDENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Inviter un Encadrant:
```bash
curl -X POST http://localhost:3000/api/club-dashboard/projects/PROJECT_ID/invite-teacher \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "teacherId": "TEACHER_ID" }'
```

---

## 🖥️ Tests via l'Interface Frontend

### Test 1: Navigation Basique
```
1. Aller à http://localhost:5173
2. Se connecter avec un compte club
3. Cliquer sur l'avatar
4. Vérifier que "Dashboard Club" est visible
5. Cliquer sur "Dashboard Club"
```

### Test 2: Affichage du Profil
```
1. Dans le dashboard, cliquer sur l'onglet "Profil"
2. Vérifier que les informations du club s'affichent
3. Cliquer sur "Modifier"
4. Éditer les champs
5. Cliquer sur "Enregistrer"
6. Vérifier la mise à jour
```

### Test 3: Gestion des Événements
```
1. Cliquer sur l'onglet "Événements"
2. Cliquer sur "+ Nouvel Événement"
3. Remplir le formulaire:
   - Titre: "Mon événement test"
   - Description: "Une description"
   - Date: Choisir une date future
   - Lieu: "Salle de test"
   - Capacité: 50
   - Type: "atelier"
4. Cliquer sur "Enregistrer"
5. Vérifier que l'événement apparaît dans la liste
```

### Test 4: Gestion des Projets
```
1. Cliquer sur l'onglet "Projets"
2. Cliquer sur "+ Nouveau Projet"
3. Remplir le formulaire:
   - Titre: "Mon projet test"
   - Description: "Une description"
   - Objectif: "Atteindre X résultats"
   - Deadline: Choisir une date
   - Statut: "en_attente"
   - Progression: 0
4. Cliquer sur "Enregistrer"
5. Vérifier que le projet apparaît
```

### Test 5: Gestion des Participants
```
1. Cliquer sur l'onglet "Participants"
2. Sélectionner un projet
3. Cliquer sur "+ Ajouter un participant"
4. Entrer l'ID d'un étudiant
5. Cliquer sur "Ajouter"
6. Vérifier que l'étudiant apparaît dans la liste
```

---

## 🔍 Tests de Sécurité

### Test 1: Accès Non Authentifié
```bash
curl http://localhost:3000/api/club-dashboard/profile
# Devrait retourner: 401 Unauthorized
```

### Test 2: Accès avec Mauvais Rôle
```bash
# Se connecter comme étudiant
curl -X POST http://localhost:3000/api/club-dashboard/events \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "titre": "Test" }'
# Devrait retourner: 403 Forbidden
```

### Test 3: Accès à Autre Club
```bash
# Essayer de modifier le profil d'un autre club
curl -X PATCH http://localhost:3000/api/club-dashboard/profile \
  -H "Authorization: Bearer CLUB_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "nom": "Attaque" }'
# Devrait échouer (vérifier clubId)
```

---

## 📊 Checklist de Test Complète

### Backend:
- [ ] Routes d'authentification fonctionnent
- [ ] Token JWT valide
- [ ] Endpoints accessibles avec authentification
- [ ] Endpoints refusent les non-authentifiés
- [ ] Endpoints refusent les mauvais rôles
- [ ] CRUD des profils fonctionne
- [ ] CRUD des événements fonctionne
- [ ] CRUD des projets fonctionne
- [ ] Validations des participations fonctionnent
- [ ] Invitations des enseignants fonctionnent
- [ ] Gestion des erreurs complète
- [ ] Stats calculées correctement

### Frontend:
- [ ] Page accessible pour les clubs
- [ ] Page refusée pour les non-clubs
- [ ] Affichage des stats
- [ ] Affichage du profil
- [ ] Édition du profil
- [ ] Création d'événement
- [ ] Modification d'événement
- [ ] Suppression d'événement
- [ ] Validation des participations
- [ ] Invitation des enseignants
- [ ] Création de projet
- [ ] Modification de projet
- [ ] Suppression de projet
- [ ] Gestion des participants
- [ ] Interface responsive
- [ ] Notifications toast fonctionnent

### Données:
- [ ] Données persistées en DB
- [ ] Relations correctes
- [ ] Pas de données orphelines
- [ ] Suppression en cascade fonctionne

---

## 🐛 Dépannage des Tests

### Erreur: "Invalid token"
```
Solution: Vérifier que le token n'a pas expiré
Renouveler le token en se reconnectant
```

### Erreur: "Forbidden"
```
Solution: Vérifier que l'utilisateur a le rôle "club"
Vérifier que req.user.clubId est défini
```

### Erreur: "Not Found"
```
Solution: Vérifier que l'ID existe en base de données
Vérifier que c'est le bon format MongoDB ObjectId
```

### Les modifications ne s'affichent pas
```
Solution: Recharger la page (F5)
Vérifier que la requête API a réussi (200/201)
Regarder la console du navigateur pour les erreurs
```

---

## 📈 Tests de Charge

### Créer 100 événements:
```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/club-dashboard/events \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"titre\": \"Événement $i\", \"date\": \"2026-06-15T14:00:00Z\"}"
done
```

### Mesurer les temps de réponse:
```bash
time curl http://localhost:3000/api/club-dashboard/events \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Validation Finale

Avant de déployer en production:
- [ ] Tous les tests passent
- [ ] Aucune erreur dans les logs
- [ ] Performance acceptable (< 500ms)
- [ ] Sécurité validée
- [ ] Documentation à jour
- [ ] Code review réalisée

---

**Prêt à tester!** 🚀

Commencez par tester via l'interface web, puis validez les endpoints API via cURL.
