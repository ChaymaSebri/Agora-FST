# Events API Contract (P0)

Base path: `/api/events`

All responses use JSON.

## Response Envelope

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message"
  }
}
```

---

## 1) GET `/api/events`

List events with optional filters.

### Query params (optional)
- `page` (number, default `1`)
- `limit` (number, default `10`)
- `type` (`conference|atelier|hackathon|sortie|autre`)
- `dateFrom` (ISO date)
- `dateTo` (ISO date)
- `search` (string)
- `sortBy` (`date|createdAt`, default `date`)
- `sortOrder` (`asc|desc`, default `asc`)

### 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "eventId",
        "titre": "Atelier IA",
        "description": "...",
        "date": "2026-05-12T09:00:00.000Z",
        "lieu": "Salle A302",
        "capacite": 50,
        "attendees": 12,
        "participantsCount": 12,
        "type": "atelier",
        "organisateurId": "userId",
        "createdAt": "2026-04-20T10:00:00.000Z",
        "updatedAt": "2026-04-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

---

## 2) GET `/api/events/:id`

Get one event by id.

### 200

```json
{
  "success": true,
  "data": {
    "id": "eventId",
    "titre": "Atelier IA",
    "description": "...",
    "date": "2026-05-12T09:00:00.000Z",
    "lieu": "Salle A302",
    "capacite": 50,
    "attendees": 12,
    "participantsCount": 12,
    "type": "atelier",
    "organisateurId": "userId",
    "createdAt": "2026-04-20T10:00:00.000Z",
    "updatedAt": "2026-04-20T10:00:00.000Z"
  }
}
```

`attendees` and `participantsCount` represent the same active participation count and are both returned for compatibility.

### 404

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event not found"
  }
}
```

---

## 3) POST `/api/events`

Create a new event.

### Body

```json
{
  "titre": "Atelier IA",
  "description": "Initiation pratique",
  "date": "2026-05-12T09:00:00.000Z",
  "lieu": "Salle A302",
  "capacite": 50,
  "type": "atelier",
  "organisateurId": "userId"
}
```

### 201

```json
{
  "success": true,
  "data": {
    "id": "eventId"
  }
}
```

### 400

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload"
  }
}
```

---

## 4) PATCH `/api/events/:id`

Partial update event.

### Body
Any subset of create body fields.

### 200

```json
{
  "success": true,
  "data": {
    "id": "eventId"
  }
}
```

### 404

`EVENT_NOT_FOUND`

---

## 5) DELETE `/api/events/:id`

Delete event.

### 200

```json
{
  "success": true,
  "data": {
    "id": "eventId",
    "deleted": true
  }
}
```

### 404

`EVENT_NOT_FOUND`

---

## 6) POST `/api/events/:id/participations`

Register a user to an event.

### Body

```json
{
  "utilisateurId": "userId",
  "commentaire": "optional"
}
```

### 201

```json
{
  "success": true,
  "data": {
    "id": "participationId"
  }
}
```

### 404
- `EVENT_NOT_FOUND`
- `USER_NOT_FOUND`

### 409
- `ALREADY_REGISTERED`
- `EVENT_FULL`

---

## 7) DELETE `/api/events/:id/participations/:utilisateurId`

Cancel one registration.

### 200

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### 404
- `EVENT_NOT_FOUND`
- `PARTICIPATION_NOT_FOUND`

---

## 8) GET `/api/events/:id/participations`

List registrations for one event.

### 200

```json
{
  "success": true,
  "data": {
    "eventId": "eventId",
    "count": 1,
    "items": [
      {
        "id": "participationId",
        "utilisateurId": "userId",
        "dateInscription": "2026-04-20T10:00:00.000Z",
        "statut": "inscrit",
        "commentaire": "optional",
        "createdAt": "2026-04-20T10:00:00.000Z",
        "updatedAt": "2026-04-20T10:00:00.000Z"
      }
    ]
  }
}
```

### 404
`EVENT_NOT_FOUND`
