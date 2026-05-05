const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const app = require('../src/app');
const { Competence } = require('../src/models');

jest.setTimeout(120000);

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });

  await mongoose.connect(replSet.getUri(), {
    dbName: 'agora_competences_test',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});

beforeEach(async () => {
  await Competence.deleteMany({});
});

describe('Competences API integration', () => {
  test('lists active competencies in alphabetical order', async () => {
    await Competence.create([
      { nom: 'Cloud' },
      { nom: 'AI' },
      { nom: 'Legacy', isActive: false },
    ]);

    const response = await request(app).get('/api/competences');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items.map((item) => item.nom)).toEqual(['AI', 'Cloud']);
    expect(response.body.items.every((item) => item.slug)).toBe(true);
  });
});
