const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const app = require('../src/app');
const { Evenement, ParticipationEvenement, Utilisateur } = require('../src/models');

jest.setTimeout(120000);

let replSet;

async function createUser(overrides = {}) {
  return Utilisateur.create({
    nom: 'Doe',
    prenom: 'John',
    email: `user_${Date.now()}_${Math.random().toString(16).slice(2)}@test.com`,
    motDePasse: 'password123',
    role: 'etudiant',
    niveau: '3A',
    filiere: 'INFO',
    ...overrides,
  });
}

async function createEvent({ organisateurId, overrides = {} }) {
  return Evenement.create({
    titre: 'Atelier IA',
    description: 'Initiation pratique',
    date: new Date('2026-06-10T09:00:00.000Z'),
    lieu: 'Salle A302',
    capacite: 50,
    participantsCount: 0,
    type: 'atelier',
    organisateurId,
    ...overrides,
  });
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });

  await mongoose.connect(replSet.getUri(), {
    dbName: 'agora_events_test',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});

beforeEach(async () => {
  jest.restoreAllMocks();

  await Promise.all([
    ParticipationEvenement.deleteMany({}),
    Evenement.deleteMany({}),
    Utilisateur.deleteMany({}),
  ]);
});

describe('Events API integration', () => {
  test('create event: POST /api/events returns 201 and id', async () => {
    const organisateur = await createUser();

    const response = await request(app)
      .post('/api/events')
      .send({
        titre: 'Hackathon Web',
        description: '48h coding sprint',
        date: '2026-07-20T08:00:00.000Z',
        lieu: 'Amphi B',
        capacite: 120,
        type: 'hackathon',
        organisateurId: organisateur._id.toString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();

    const created = await Evenement.findById(response.body.data.id);
    expect(created).toBeTruthy();
    expect(created.titre).toBe('Hackathon Web');
  });

  test('update event: PATCH /api/events/:id updates fields', async () => {
    const organisateur = await createUser();
    const event = await createEvent({ organisateurId: organisateur._id });

    const response = await request(app)
      .patch(`/api/events/${event._id}`)
      .send({
        titre: 'Atelier IA Avance',
        capacite: 75,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updated = await Evenement.findById(event._id);
    expect(updated.titre).toBe('Atelier IA Avance');
    expect(updated.capacite).toBe(75);
  });

  test('delete event: DELETE /api/events/:id removes event', async () => {
    const organisateur = await createUser();
    const event = await createEvent({ organisateurId: organisateur._id });

    const response = await request(app).delete(`/api/events/${event._id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deleted).toBe(true);

    const deleted = await Evenement.findById(event._id);
    expect(deleted).toBeNull();
  });

  test('delete event cascade: DELETE /api/events/:id removes related participations', async () => {
    const organisateur = await createUser();
    const participant = await createUser({
      email: `cascade_${Date.now()}@test.com`,
    });
    const event = await createEvent({
      organisateurId: organisateur._id,
      overrides: { capacite: 3, participantsCount: 1 },
    });

    await ParticipationEvenement.create({
      evenementId: event._id,
      utilisateurId: participant._id,
      statut: 'inscrit',
    });

    const response = await request(app).delete(`/api/events/${event._id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const deletedEvent = await Evenement.findById(event._id);
    expect(deletedEvent).toBeNull();

    const orphanParticipation = await ParticipationEvenement.findOne({ evenementId: event._id });
    expect(orphanParticipation).toBeNull();
  });

  test('list events: GET /api/events returns items, pagination and participant counts', async () => {
    const organisateur = await createUser();
    const event1 = await createEvent({
      organisateurId: organisateur._id,
      overrides: {
        titre: 'Conference JS',
        type: 'conference',
        date: new Date('2026-06-12T10:00:00.000Z'),
      },
    });
    const event2 = await createEvent({
      organisateurId: organisateur._id,
      overrides: {
        titre: 'Atelier React',
        type: 'atelier',
        date: new Date('2026-06-13T10:00:00.000Z'),
      },
    });

    const participant = await createUser({
      email: `participant_${Date.now()}@test.com`,
    });

    await ParticipationEvenement.create({
      evenementId: event2._id,
      utilisateurId: participant._id,
      statut: 'inscrit',
    });

    const response = await request(app)
      .get('/api/events')
      .query({
        page: 1,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'asc',
        type: 'atelier',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(response.body.data.pagination).toBeDefined();
    expect(response.body.data.pagination.page).toBe(1);

    const [onlyAtelier] = response.body.data.items;
    expect(response.body.data.items).toHaveLength(1);
    expect(onlyAtelier.id).toBe(event2._id.toString());
    expect(onlyAtelier.participantsCount).toBe(1);
    expect(onlyAtelier.attendees).toBe(1);

    expect(event1._id.toString()).not.toBe(onlyAtelier.id);
  });

  test('get event detail: GET /api/events/:id returns participant count', async () => {
    const organisateur = await createUser();
    const event = await createEvent({ organisateurId: organisateur._id });
    const participant = await createUser({
      email: `detail_${Date.now()}@test.com`,
    });

    await ParticipationEvenement.create({
      evenementId: event._id,
      utilisateurId: participant._id,
      statut: 'inscrit',
    });

    const response = await request(app).get(`/api/events/${event._id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(event._id.toString());
    expect(response.body.data.participantsCount).toBe(1);
    expect(response.body.data.attendees).toBe(1);
  });

  test('register user: POST /api/events/:id/participations creates participation', async () => {
    const organisateur = await createUser();
    const participant = await createUser({
      email: `register_${Date.now()}@test.com`,
    });
    const event = await createEvent({
      organisateurId: organisateur._id,
      overrides: { capacite: 2 },
    });

    const response = await request(app)
      .post(`/api/events/${event._id}/participations`)
      .send({
        utilisateurId: participant._id.toString(),
        commentaire: 'Je participe',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();

    const participation = await ParticipationEvenement.findById(response.body.data.id);
    expect(participation).toBeTruthy();

    const refreshedEvent = await Evenement.findById(event._id);
    expect(refreshedEvent.participantsCount).toBe(1);
  });

  test('unregister user: DELETE /api/events/:id/participations/:utilisateurId removes participation', async () => {
    const organisateur = await createUser();
    const participant = await createUser({
      email: `unregister_${Date.now()}@test.com`,
    });
    const event = await createEvent({
      organisateurId: organisateur._id,
      overrides: { capacite: 2 },
    });

    await request(app)
      .post(`/api/events/${event._id}/participations`)
      .send({ utilisateurId: participant._id.toString() });

    const response = await request(app).delete(
      `/api/events/${event._id}/participations/${participant._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deleted).toBe(true);

    const deletedParticipation = await ParticipationEvenement.findOne({
      evenementId: event._id,
      utilisateurId: participant._id,
    });
    expect(deletedParticipation).toBeNull();

    const refreshedEvent = await Evenement.findById(event._id);
    expect(refreshedEvent.participantsCount).toBe(0);
  });

  test('full event: second registration returns 409 EVENT_FULL', async () => {
    const organisateur = await createUser();
    const participant1 = await createUser({
      email: `full1_${Date.now()}@test.com`,
    });
    const participant2 = await createUser({
      email: `full2_${Date.now()}@test.com`,
    });

    const event = await createEvent({
      organisateurId: organisateur._id,
      overrides: { capacite: 1 },
    });

    const first = await request(app)
      .post(`/api/events/${event._id}/participations`)
      .send({ utilisateurId: participant1._id.toString() });

    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/events/${event._id}/participations`)
      .send({ utilisateurId: participant2._id.toString() });

    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
    expect(second.body.error.code).toBe('EVENT_FULL');
  });

  test('duplicate registration: same user second registration returns 409 ALREADY_REGISTERED', async () => {
    const organisateur = await createUser();
    const participant = await createUser({
      email: `dup_${Date.now()}@test.com`,
    });

    const event = await createEvent({
      organisateurId: organisateur._id,
      overrides: { capacite: 3 },
    });

    const first = await request(app)
      .post(`/api/events/${event._id}/participations`)
      .send({ utilisateurId: participant._id.toString() });

    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/events/${event._id}/participations`)
      .send({ utilisateurId: participant._id.toString() });

    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
    expect(second.body.error.code).toBe('ALREADY_REGISTERED');
  });

  test('register fallback: succeeds when transactions are not supported', async () => {
    const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockImplementationOnce(async () => {
      throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
    });

    const organisateur = await createUser();
    const participant = await createUser({
      email: `fallback_register_${Date.now()}@test.com`,
    });
    const event = await createEvent({
      organisateurId: organisateur._id,
      overrides: { capacite: 2 },
    });

    const response = await request(app)
      .post(`/api/events/${event._id}/participations`)
      .send({ utilisateurId: participant._id.toString() });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const refreshedEvent = await Evenement.findById(event._id);
    expect(refreshedEvent.participantsCount).toBe(1);

    startSessionSpy.mockRestore();
  });

  test('unregister fallback: succeeds when transactions are not supported', async () => {
    const organisateur = await createUser();
    const participant = await createUser({
      email: `fallback_unregister_${Date.now()}@test.com`,
    });
    const event = await createEvent({
      organisateurId: organisateur._id,
      overrides: { capacite: 2 },
    });

    await request(app)
      .post(`/api/events/${event._id}/participations`)
      .send({ utilisateurId: participant._id.toString() });

    const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockImplementationOnce(async () => {
      throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
    });

    const response = await request(app).delete(
      `/api/events/${event._id}/participations/${participant._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const deletedParticipation = await ParticipationEvenement.findOne({
      evenementId: event._id,
      utilisateurId: participant._id,
    });
    expect(deletedParticipation).toBeNull();

    const refreshedEvent = await Evenement.findById(event._id);
    expect(refreshedEvent.participantsCount).toBe(0);

    startSessionSpy.mockRestore();
  });

  test('delete event fallback cascade: removes participations when transactions are not supported', async () => {
    const organisateur = await createUser();
    const participant = await createUser({
      email: `cascade_fallback_${Date.now()}@test.com`,
    });
    const event = await createEvent({
      organisateurId: organisateur._id,
      overrides: { capacite: 3, participantsCount: 1 },
    });

    await ParticipationEvenement.create({
      evenementId: event._id,
      utilisateurId: participant._id,
      statut: 'inscrit',
    });

    const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockImplementationOnce(async () => {
      throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
    });

    const response = await request(app).delete(`/api/events/${event._id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const deletedEvent = await Evenement.findById(event._id);
    expect(deletedEvent).toBeNull();

    const orphanParticipation = await ParticipationEvenement.findOne({ evenementId: event._id });
    expect(orphanParticipation).toBeNull();

    startSessionSpy.mockRestore();
  });
});
