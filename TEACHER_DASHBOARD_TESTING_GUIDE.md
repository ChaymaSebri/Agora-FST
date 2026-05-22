# Teacher Dashboard - Testing Guide

## Backend Testing

### Prerequisites
- Backend server running on port 5000
- MongoDB database with test data
- Authentication token for teacher user

### Test Endpoints

#### 1. Get All Events (Public)
```bash
# Command
curl -X GET http://localhost:5000/api/teacher-dashboard/events

# Expected Response (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "titre": "Conference on AI",
        "description": "...",
        "date": "2024-02-15T10:00:00.000Z",
        "lieu": "Room 101",
        "capacite": 50,
        "participantsCount": 25,
        "type": "conference",
        "organisateur": "John Doe",
        "clubName": "Tech Club",
        "createdAt": "..."
      }
    ]
  }
}
```

#### 2. Get Single Event (Public)
```bash
# Command
curl -X GET http://localhost:5000/api/teacher-dashboard/events/EVENT_ID

# Expected Response (200 OK)
{
  "success": true,
  "data": {
    "id": "...",
    "titre": "Conference on AI",
    "description": "...",
    "date": "2024-02-15T10:00:00.000Z",
    "lieu": "Room 101",
    "capacite": 50,
    "participantsCount": 25,
    "type": "conference",
    "organisateur": "John Doe",
    "clubName": "Tech Club"
  }
}
```

#### 3. Get All Projects (Public)
```bash
# Command
curl -X GET http://localhost:5000/api/teacher-dashboard/projects

# Expected Response (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "titre": "ML Model Development",
        "description": "...",
        "objectif": "Build and deploy ML model",
        "dateDebut": "2024-01-01T00:00:00.000Z",
        "deadline": "2024-03-01T00:00:00.000Z",
        "statut": "en_cours",
        "progression": 45,
        "enseignantId": "...",
        "enseignant": "Jane Smith",
        "etudiantsCount": 4,
        "clubId": "...",
        "clubName": "AI Club",
        "createdAt": "..."
      }
    ]
  }
}
```

#### 4. Get Single Project (Public)
```bash
# Command
curl -X GET http://localhost:5000/api/teacher-dashboard/projects/PROJECT_ID

# Expected Response (200 OK)
{
  "success": true,
  "data": {
    "id": "...",
    "titre": "ML Model Development",
    "description": "...",
    "objectif": "Build and deploy ML model",
    "dateDebut": "2024-01-01T00:00:00.000Z",
    "deadline": "2024-03-01T00:00:00.000Z",
    "statut": "en_cours",
    "progression": 45,
    "enseignant": "Jane Smith",
    "etudiants": [
      {
        "id": "...",
        "nom": "Dupont",
        "prenom": "Marie",
        "email": "marie@example.com"
      }
    ],
    "clubName": "AI Club"
  }
}
```

#### 5. Get Teacher Event Invitations (Protected)
```bash
# Prerequisites
# 1. Create a teacher account or have a teacher token
# 2. Have an event with teacher invitation (ParticipationEvenement with utilisateurId = teacher ID)

# Command
curl -X GET http://localhost:5000/api/teacher-dashboard/teacher/event-invitations \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"

# Expected Response (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "invitationId": "...",
        "evenementId": "...",
        "titre": "Workshop on Data Science",
        "description": "...",
        "date": "2024-02-20T14:00:00.000Z",
        "lieu": "Lab 205",
        "type": "atelier",
        "statut": "inscrit",
        "clubName": "Data Science Club",
        "organisateur": "Alice Johnson",
        "dateInvitation": "2024-02-01T10:00:00.000Z"
      }
    ]
  }
}
```

#### 6. Accept Event Invitation (Protected)
```bash
# Command
curl -X PATCH http://localhost:5000/api/teacher-dashboard/teacher/event-invitations/INVITATION_ID \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"statut":"confirme"}'

# Expected Response (200 OK)
{
  "success": true,
  "message": "Invitation acceptée",
  "data": {
    "id": "...",
    "statut": "confirme"
  }
}
```

#### 7. Refuse Event Invitation (Protected)
```bash
# Command
curl -X PATCH http://localhost:5000/api/teacher-dashboard/teacher/event-invitations/INVITATION_ID \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"statut":"annule"}'

# Expected Response (200 OK)
{
  "success": true,
  "message": "Invitation refusée",
  "data": {
    "id": "...",
    "statut": "annule"
  }
}
```

#### 8. Get Supervised Projects (Protected)
```bash
# Prerequisites
# Have projects where enseignantId = current teacher

# Command
curl -X GET http://localhost:5000/api/teacher-dashboard/teacher/projects \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"

# Expected Response (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "titre": "Mobile App Development",
        "description": "...",
        "objectif": "Create iOS application",
        "dateDebut": "2024-01-15T00:00:00.000Z",
        "deadline": "2024-04-01T00:00:00.000Z",
        "statut": "en_cours",
        "progression": 60,
        "etudiantsCount": 3,
        "etudiants": [
          {
            "id": "...",
            "nom": "Martin",
            "prenom": "Thomas",
            "email": "thomas@example.com"
          }
        ],
        "clubName": "Mobile Dev Club",
        "createdAt": "..."
      }
    ]
  }
}
```

#### 9. Get Project Invitations (Protected)
```bash
# Command
curl -X GET http://localhost:5000/api/teacher-dashboard/teacher/project-invitations \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"

# Expected Response (200 OK)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "titre": "Web Development",
        "description": "...",
        "statut": "en_cours",
        "progression": 75,
        "deadline": "2024-05-15T00:00:00.000Z",
        "clubName": "Web Club",
        "reponse": "accepte"
      }
    ]
  }
}
```

## Frontend Testing

### Setup
1. Ensure frontend dev server is running (`npm run dev` in frontend folder)
2. Navigate to `http://localhost:5173`
3. Log in as a teacher user (role: `enseignant`)

### Test Scenarios

#### Test 1: Navigation to Teacher Dashboard
**Steps:**
1. Log in as teacher
2. Open user menu (click avatar)
3. Verify "Dashboard Enseignant" menu item appears
4. Click on "Dashboard Enseignant"

**Expected:**
- Redirected to `/teacher-dashboard`
- Dashboard loads with 4 statistics cards
- Tabs visible: Invitations, Projets, Événements, Projets

#### Test 2: View Event Invitations
**Steps:**
1. Go to Teacher Dashboard
2. Click "Invitations" tab
3. Wait for invitations to load

**Expected:**
- List of event invitations displayed
- Each invitation shows: titre, club, organisateur, date, lieu, status badge
- If statut = 'inscrit': show "Accepter" and "Refuser" buttons
- Other statuts: no buttons visible

#### Test 3: Accept Event Invitation
**Steps:**
1. Go to "Invitations" tab
2. Find invitation with status "En attente"
3. Click "Accepter" button
4. Verify toast notification appears

**Expected:**
- Toast: "Succès - Invitation acceptée"
- Invitation list refreshes
- Status changes to "Acceptée"
- Buttons disappear

#### Test 4: Refuse Event Invitation
**Steps:**
1. Go to "Invitations" tab
2. Find invitation with status "En attente"
3. Click "Refuser" button
4. Verify toast notification appears

**Expected:**
- Toast: "Succès - Invitation refusée"
- Invitation list refreshes
- Status changes to "Refusée"
- Buttons disappear

#### Test 5: View Supervised Projects
**Steps:**
1. Go to "Projets" tab
2. Wait for projects to load

**Expected:**
- List of projects where teacher is supervisor
- Each project shows:
  - Title, description, club name
  - Status badge (color-coded)
  - Progress bar with color (red <33%, yellow <66%, green ≥66%)
  - Deadline, participants count
  - Student list with emails

#### Test 6: Search Events
**Steps:**
1. Go to "Événements" tab
2. Type in search box (e.g., "conference" or club name)
3. Verify results filter in real-time

**Expected:**
- List filters by title, club, or organizer
- Results update as you type
- No matching results show "Aucun événement ne correspond"

#### Test 7: View Event Details
**Steps:**
1. Go to "Événements" tab
2. Click "Voir Détails" on any event
3. Review modal content

**Expected:**
- Modal opens with full event details
- Shows: titre, description, type, participants, date, lieu
- Modal can be closed (click outside or X button)

#### Test 8: Filter Projects by Status
**Steps:**
1. Go to "Projets Globaux" tab
2. Change status filter dropdown
3. Select different statuses

**Expected:**
- Projects list filters by status
- "Tous les statuts" shows all projects
- Other options show only matching status

#### Test 9: Statistics Cards
**Steps:**
1. Load Teacher Dashboard
2. Review top statistics cards

**Expected:**
- 4 cards displayed:
  - "Invitations": Count of pending event invitations
  - "Projets Encadrés": Count of supervised projects
  - "Tous les Événements": Total count of events
  - "Tous les Projets": Total count of projects
- Icons visible: Calendar, Briefcase
- Numbers update on tab changes

#### Test 10: Responsive Design
**Steps:**
1. Open dashboard on mobile view (resize browser to <768px)
2. Test navigation and interaction
3. Verify all tabs are accessible

**Expected:**
- Tab labels hidden on mobile (icons only)
- Cards stack vertically
- Search and filters work on mobile
- Modals display correctly

## Error Cases

### Test 11: Invalid Statut
```bash
curl -X PATCH http://localhost:5000/api/teacher-dashboard/teacher/event-invitations/INVITATION_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"statut":"invalid"}'
```

**Expected:**
- Response: 400 Bad Request
- Message: "Statut invalide"

### Test 12: Non-existent Invitation
```bash
curl -X PATCH http://localhost:5000/api/teacher-dashboard/teacher/event-invitations/INVALID_ID \
  -H "Authorization: Bearer TOKEN"
```

**Expected:**
- Response: 404 Not Found
- Message: "Invitation non trouvée"

### Test 13: Wrong Role
```bash
# Using student token
curl -X GET http://localhost:5000/api/teacher-dashboard/teacher/event-invitations \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Expected:**
- Response: 403 Forbidden
- Message: "Accès refusé - Rôle insuffisant"

### Test 14: Missing Authentication
```bash
curl -X GET http://localhost:5000/api/teacher-dashboard/teacher/event-invitations
```

**Expected:**
- Response: 401 Unauthorized
- Message: "Non authentifié"

## Performance Testing

### Large Dataset
**Steps:**
1. Create test database with many events/projects
2. Load "Tous les Événements" tab
3. Search and filter with large dataset
4. Measure response time

**Expected:**
- Events load within 2 seconds
- Filtering/searching responsive (<500ms)
- UI remains responsive during data load

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on endpoints | Verify backend routes are registered in `index.js` |
| Empty lists | Check database has actual events/projects |
| Authentication fails | Verify token is valid and teacher role is set |
| Styling looks off | Ensure Tailwind and Shadcn components are compiled |
| Toast not showing | Verify `useToast` hook is imported in component |
| Invitations don't update | Check ParticipationEvenement records exist with teacher userId |
| Buttons not appearing | Verify invitation statut is exactly "inscrit" (case-sensitive) |

## Automated Testing Commands

```bash
#!/bin/bash
# Quick test script for all endpoints

TEACHER_TOKEN="YOUR_TOKEN_HERE"
BASE_URL="http://localhost:5000/api"

echo "Testing public endpoints..."
curl -s "$BASE_URL/teacher-dashboard/events" | head -20
curl -s "$BASE_URL/teacher-dashboard/projects" | head -20

echo "Testing teacher endpoints..."
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" "$BASE_URL/teacher-dashboard/teacher/event-invitations" | head -20
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" "$BASE_URL/teacher-dashboard/teacher/projects" | head -20

echo "Testing error cases..."
curl -s -X PATCH "$BASE_URL/teacher-dashboard/teacher/event-invitations/invalid" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"statut":"invalid"}'
```

## Verification Checklist

- [ ] Backend endpoints all return 200 for valid requests
- [ ] Public endpoints accessible without authentication
- [ ] Protected endpoints require `enseignant` role
- [ ] Event invitations list shows correct data
- [ ] Accept/Refuse buttons work and update status
- [ ] Supervised projects display with student list
- [ ] Global events view is read-only
- [ ] Global projects view is read-only
- [ ] Search and filter functionality works
- [ ] Responsive design on mobile
- [ ] Error cases handled gracefully
- [ ] Toast notifications appear on success/error
- [ ] Navigation from Navbar works
- [ ] Statistics cards display correct counts
