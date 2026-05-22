# 🚀 Guide d'Intégration Rapide - Dashboard Club

## 📦 Installation & Configuration

### 1. Backend - Routes (✅ Déjà fait)
Les routes sont automatiquement intégrées dans `/api/club-dashboard/*`

**Vérifier que cela fonctionne:**
```bash
# Tester un endpoint
curl http://localhost:3000/api/club-dashboard/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Frontend - Accès à la Page

**URL directe:**
```
http://localhost:5173/club-dashboard
```

**Via le menu:**
1. Connectez-vous avec un compte `club`
2. Cliquez sur votre avatar
3. Cliquez sur "Dashboard Club"

---

## ✨ Fonctionnalités Principales

### Tableau de Synthèse:

| Fonctionnalité | Endpoint | Verbe | Status |
|---|---|---|---|
| Profil du club | `/profile` | GET/PATCH | ✅ |
| Lister événements | `/events` | GET | ✅ |
| Créer événement | `/events` | POST | ✅ |
| Modifier événement | `/events/:id` | PATCH | ✅ |
| Supprimer événement | `/events/:id` | DELETE | ✅ |
| Lister participations | `/events/:eventId/participations` | GET | ✅ |
| Valider participation | `/events/:eventId/participations/:id` | PATCH | ✅ |
| Inviter enseignant événement | `/events/:eventId/invite-teacher` | POST | ✅ |
| Lister projets | `/projects` | GET | ✅ |
| Créer projet | `/projects` | POST | ✅ |
| Modifier projet | `/projects/:projectId` | PATCH | ✅ |
| Supprimer projet | `/projects/:projectId` | DELETE | ✅ |
| Lister participants projet | `/projects/:projectId/participants` | GET | ✅ |
| Ajouter participant | `/projects/:projectId/participants` | POST | ✅ |
| Retirer participant | `/projects/:projectId/participants/:id` | DELETE | ✅ |
| Inviter enseignant projet | `/projects/:projectId/invite-teacher` | POST | ✅ |

---

## 🧪 Tests Rapides

### Test 1: Accéder au Dashboard
```bash
1. Ouvrir le navigateur
2. Aller à http://localhost:5173/club-dashboard
3. Vous devriez voir le dashboard (si connecté comme club)
```

### Test 2: Créer un événement
```bash
# Via cURL
curl -X POST http://localhost:3000/api/club-dashboard/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Mon événement test",
    "date": "2026-06-15T14:00:00Z",
    "lieu": "Salle A",
    "type": "atelier"
  }'
```

### Test 3: Lister les événements du club
```bash
curl http://localhost:3000/api/club-dashboard/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Créer un projet
```bash
curl -X POST http://localhost:3000/api/club-dashboard/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Mon projet test",
    "deadline": "2026-12-31T23:59:59Z",
    "description": "Un projet test"
  }'
```

---

## 🔍 Dépannage Courant

### Problème: "403 Forbidden" ou "Accès refusé"
**Cause**: Vous n'êtes pas connecté avec un compte club
**Solution**:
```
1. Vérifier votre rôle utilisateur
2. Assurez-vous que user.role === "club"
3. Vérifier la validité du token JWT
```

### Problème: "404 Not Found"
**Cause**: Le club n'existe pas ou l'ID est invalide
**Solution**:
```
1. Vérifier que le club est créé
2. Vérifier que user.clubId existe
3. Consulter la base de données
```

### Problème: "400 Bad Request"
**Cause**: Données manquantes ou invalides
**Solution**:
```
1. Vérifier que les champs obligatoires sont présents
2. Vérifier le format des données
3. Consulter les logs du serveur
```

### Problème: Les boutons du dashboard ne répondent pas
**Cause**: Problème de connexion API
**Solution**:
```
1. Ouvrir la console du navigateur (F12)
2. Voir les erreurs réseau
3. Vérifier que le backend fonctionne
4. Vérifier les CORS si nécessaire
```

---

## 📋 Checklist de Vérification

- [ ] Backend démarre sans erreur
- [ ] Routes `/api/club-dashboard/*` répondent
- [ ] Frontend démarre sans erreur
- [ ] Vous pouvez accéder à `/club-dashboard`
- [ ] Vous voyez le lien "Dashboard Club" dans le menu
- [ ] Vous pouvez créer un événement
- [ ] Vous pouvez créer un projet
- [ ] Vous pouvez ajouter des participants
- [ ] Les validations fonctionnent

---

## 🎯 Prochaines Étapes

### Pour les Développeurs:
1. Revoir le code des contrôleurs
2. Ajouter des tests unitaires
3. Implémenter la paginatio si nécessaire
4. Ajouter des logs plus détaillés

### Pour les Utilisateurs:
1. Tester le dashboard complètement
2. Créer des événements et projets
3. Inviter les enseignants
4. Valider les inscriptions
5. Gérer les participants

---

## 📞 Support

### Questions Fréquentes:

**Q: Où est mon dashboard?**
A: Accédez à `/club-dashboard` ou cliquez sur le lien dans votre menu profil

**Q: Je ne vois pas mes événements?**
A: Vérifiez que vous êtes connecté comme club et que vous avez créé des événements

**Q: Comment inviter un enseignant?**
A: Cliquez sur "+ Inviter un enseignant" et entrez l'ID de l'enseignant

**Q: Puis-je modifier un événement après l'avoir créé?**
A: Oui, cliquez sur "Modifier" sur l'événement

**Q: Qu'arrive-t-il si je supprime un événement?**
A: L'événement et toutes ses participations seront supprimés définitivement

---

## 🔗 Ressources Utiles

- [Documentation Complète](./CLUB_DASHBOARD_DOCUMENTATION.md)
- [Détails d'Implémentation](./CLUB_DASHBOARD_IMPLEMENTATION.md)
- [API Rest](./INTEGRATION_GUIDE.md)
- [Modèle de Données](./README.md)

---

**Dernière mise à jour**: Mai 2026
**Prêt pour la production**: ✅ Oui
