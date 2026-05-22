# Teacher Dashboard - Implementation Guide

## Overview

The Teacher Dashboard (`/teacher-dashboard`) provides enseignants (teachers) with:

1. **Event Invitations Management** - Accept/Refuse invitations to events
2. **Project Supervision** - View and manage projects they're supervising
3. **Global Events View** - Read-only view of all available events
4. **Global Projects View** - Read-only view of all available projects

## Backend Implementation

### Controllers: `backend/src/controllers/teacher-dashboard.controller.js`

#### Global Read-Only Endpoints

**`getAllEvents()`** - GET `/api/teacher-dashboard/events`
- Returns all events with organizer, club, and participant count information
- Accessible to any authenticated user
- Response includes: titre, description, date, lieu, capacite, type, organisateur, clubName, participantsCount

**`getEventById(eventId)`** - GET `/api/teacher-dashboard/events/:id`
- Returns detailed information about a single event
- Accessible to any authenticated user

**`getAllProjects()`** - GET `/api/teacher-dashboard/projects`
- Returns all projects with supervisor, students, and progression information
- Accessible to any authenticated user
- Response includes: titre, description, statut, progression, enseignant, etudiantsCount, clubName

**`getProjectById(projectId)`** - GET `/api/teacher-dashboard/projects/:id`
- Returns detailed information about a single project with all participants
- Accessible to any authenticated user

#### Teacher-Specific Endpoints

**`getTeacherEventInvitations()`** - GET `/api/teacher-dashboard/teacher/event-invitations`
- Returns all event invitations for the current teacher
- Requires: authentication + `enseignant` role
- Uses: ParticipationEvenement model where utilisateurId = teacher ID

**`respondToEventInvitation(invitationId, statut)`** - PATCH `/api/teacher-dashboard/teacher/event-invitations/:invitationId`
- Allows teacher to accept (`confirme`) or refuse (`annule`) event invitations
- Requires: authentication + `enseignant` role
- Request body: `{ statut: "confirme" | "annule" }`

**`getTeacherProjectEncadrement()`** - GET `/api/teacher-dashboard/teacher/projects`
- Returns all projects where the teacher is the supervisor (enseignantId)
- Requires: authentication + `enseignant` role
- Includes: students list, progression, deadline information

**`getTeacherProjectInvitations()`** - GET `/api/teacher-dashboard/teacher/project-invitations`
- Returns project invitations for the teacher
- Requires: authentication + `enseignant` role

### Routes: `backend/src/routes/teacher-dashboard.routes.js`

```javascript
// Public - Global Views (No authentication required)
GET    /events              // getAllEvents
GET    /events/:id          // getEventById
GET    /projects            // getAllProjects
GET    /projects/:id        // getProjectById

// Teacher-Only (Requires enseignant role)
GET    /teacher/event-invitations                    // getTeacherEventInvitations
PATCH  /teacher/event-invitations/:invitationId      // respondToEventInvitation
GET    /teacher/projects                             // getTeacherProjectEncadrement
GET    /teacher/project-invitations                  // getTeacherProjectInvitations
```

### Integration

Routes registered in `backend/src/routes/index.js`:
```javascript
router.use('/teacher-dashboard', require('./teacher-dashboard.routes'));
```

## Frontend Implementation

### Service API: `frontend/src/services/teacher-dashboard.api.ts`

Functions mirror all backend endpoints with TypeScript typing:

```typescript
// Global Views
getAllEvents()
getEventById(eventId: string)
getAllProjects()
getProjectById(projectId: string)

// Teacher-Specific
getTeacherEventInvitations()
respondToEventInvitation(invitationId: string, statut: 'confirme' | 'annule')
getTeacherProjectEncadrement()
getTeacherProjectInvitations()
```

### Components

#### `TeacherDashboard.tsx` (Main Page)
- Location: `frontend/src/pages/TeacherDashboard.tsx`
- Features:
  - Stats dashboard (invitations, encadrement, global events, global projects)
  - 4 tabs: Invitations, Projets, Événements, Projets Globaux
  - Load stats on mount
  - Responsive design with icons

#### `TeacherEventInvitations.tsx`
- Location: `frontend/src/components/Teacher/TeacherEventInvitations.tsx`
- Displays list of event invitations
- Features:
  - Show invitation status badge
  - Accept/Refuse buttons for pending invitations (`statut === 'inscrit'`)
  - Event details: date, lieu, type, organisateur, club
  - Real-time update after response

#### `TeacherProjectEncadrement.tsx`
- Location: `frontend/src/components/Teacher/TeacherProjectEncadrement.tsx`
- Displays projects the teacher supervises
- Features:
  - Progress bar visualization (color-coded by percentage)
  - Status badges (en_attente, en_cours, termine, annule)
  - Student list with email
  - Deadline and progression information

#### `GlobalEventsList.tsx`
- Location: `frontend/src/components/Teacher/GlobalEventsList.tsx`
- Read-only view of all events
- Features:
  - Search by title, club, or organizer
  - Event details modal
  - Participant capacity display
  - Type badges

#### `GlobalProjectsList.tsx`
- Location: `frontend/src/components/Teacher/GlobalProjectsList.tsx`
- Read-only view of all projects
- Features:
  - Search and filter by status
  - Progress bar with color coding
  - Details modal
  - Supervisor and participant information

### Navigation Integration

**App.tsx**:
```typescript
<Route 
  path="/teacher-dashboard" 
  element={
    <ProtectedRoute requireRole="enseignant">
      <TeacherDashboard />
    </ProtectedRoute>
  } 
/>
```

**Navbar.tsx**:
- Added `BookOpen` icon import
- Added menu item for `enseignant` role:
```typescript
{user?.role === "enseignant" && (
  <DropdownMenuItem asChild>
    <Link to="/teacher-dashboard" className="cursor-pointer">
      <BookOpen className="w-4 h-4 mr-2" />
      Dashboard Enseignant
    </Link>
  </DropdownMenuItem>
)}
```

## Data Models Used

### Evenement
- `_id`: ObjectId
- `titre`: String (required)
- `description`: String
- `date`: Date (required)
- `lieu`: String
- `capacite`: Number
- `type`: String (conference|atelier|hackathon|sortie|autre)
- `organisateurId`: Reference to Utilisateur
- `clubId`: Reference to Club

### ParticipationEvenement
- `_id`: ObjectId
- `evenementId`: Reference to Evenement
- `utilisateurId`: Reference to Utilisateur (can be student or teacher)
- `statut`: String (inscrit|confirme|annule|present)
- `dateInscription`: Date

### Projet
- `_id`: ObjectId
- `titre`: String (required)
- `description`: String
- `objectif`: String
- `dateDebut`: Date
- `deadline`: Date (required)
- `statut`: String (en_attente|en_cours|termine|annule)
- `progression`: Number (0-100)
- `enseignantId`: Reference to Utilisateur (teacher)
- `etudiantIds`: [Reference to Utilisateur] (students)
- `clubId`: Reference to Club

## Usage Workflow

### As a Teacher

1. **View Invitations**:
   - Go to Dashboard → Invitations tab
   - See all event invitations with status
   - Accept or Refuse pending invitations

2. **Manage Supervised Projects**:
   - Go to Dashboard → Projets tab
   - View all projects where you're the supervisor
   - See student list and progression

3. **Browse All Events**:
   - Go to Dashboard → Événements tab
   - Search events by title, club, or organizer
   - View event details in modal

4. **Browse All Projects**:
   - Go to Dashboard → Projets Globaux tab
   - Filter by status or search
   - View project details and supervisor information

## Error Handling

All endpoints use the `ApiError` utility with appropriate HTTP status codes:

- `400 Bad Request` - Invalid input (e.g., invalid statut)
- `404 Not Found` - Event/Project/Invitation not found
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Wrong role for protected endpoints

Frontend handles errors with toast notifications (useToast hook).

## Testing Endpoints

```bash
# Get all events (public)
curl http://localhost:5000/api/teacher-dashboard/events

# Get all projects (public)
curl http://localhost:5000/api/teacher-dashboard/projects

# Get teacher event invitations (requires auth token)
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/teacher-dashboard/teacher/event-invitations

# Accept event invitation
curl -X PATCH http://localhost:5000/api/teacher-dashboard/teacher/event-invitations/INVITATION_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"statut":"confirme"}'

# Get supervised projects (requires auth token)
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/teacher-dashboard/teacher/projects
```

## Statistics Displayed

The dashboard stats card shows:
- **Invitations**: Count of event invitations for the teacher
- **Projets Encadrés**: Count of projects where teacher is supervisor
- **Tous les Événements**: Total count of all events
- **Tous les Projets**: Total count of all projects

Stats are calculated on component mount and update when switching tabs.

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── teacher-dashboard.controller.js    (350+ lines, 8 functions)
│   └── routes/
│       └── teacher-dashboard.routes.js        (8 routes)

frontend/
├── src/
│   ├── pages/
│   │   └── TeacherDashboard.tsx               (Main page, stats, tabs)
│   ├── components/
│   │   └── Teacher/
│   │       ├── TeacherEventInvitations.tsx    (Invitations management)
│   │       ├── TeacherProjectEncadrement.tsx  (Supervised projects)
│   │       ├── GlobalEventsList.tsx           (All events, read-only)
│   │       └── GlobalProjectsList.tsx         (All projects, read-only)
│   ├── services/
│   │   └── teacher-dashboard.api.ts           (API client, 8 functions)
│   └── App.tsx                                (Route added)
```

## Notes

- All teacher-specific endpoints require `enseignant` role authentication
- Global endpoints are public but still perform queries on the database
- Event invitations are stored in ParticipationEvenement with utilisateurId = teacher ID
- Project supervision is managed via the enseignantId field in Projet model
- UI follows the same Shadcn/ui design system as Club Dashboard
- Dates are formatted using date-fns with French locale
- Component state management uses React hooks (useState, useEffect)
