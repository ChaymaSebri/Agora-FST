const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.mock('../src/services/email.service', () => ({
  sendVerificationCodeEmail: jest.fn().mockResolvedValue(undefined),
}));

const { sendVerificationCodeEmail } = require('../src/services/email.service');
const app = require('../src/app');
const { Utilisateur, Club } = require('../src/models');

jest.setTimeout(120000);

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });

  await mongoose.connect(replSet.getUri(), {
    dbName: 'agora_auth_test',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});

beforeEach(async () => {
  jest.clearAllMocks();

  await Promise.all([
    Utilisateur.deleteMany({}),
    Club.deleteMany({}),
  ]);
});

async function registerStudent(overrides = {}) {
  const email = overrides.email || `student_${Date.now()}_${Math.random().toString(16).slice(2)}@test.com`;

  return request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'StrongPass1!',
      fullName: 'John Doe',
      role: 'etudiant',
      niveau: 'L3',
      filiere: 'Informatique',
      ...overrides,
    });
}

describe('Auth API integration', () => {
  test('accepts uncommon domains and relies on OTP verification', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'meriem@gmaik.co',
        password: 'StrongPass1!',
        fullName: 'Meriem Test',
        role: 'etudiant',
        niveau: 'L3',
        filiere: 'Informatique',
      });

    expect(response.status).toBe(201);
    expect(response.body.needsVerification).toBe(true);
    expect(response.body.email).toBe('meriem@gmaik.co');
    expect(sendVerificationCodeEmail).toHaveBeenCalledTimes(1);
  });

  test('register sends a verification code and blocks login until verification', async () => {
    const registerResponse = await registerStudent();

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.needsVerification).toBe(true);
    expect(registerResponse.body.email).toContain('@test.com');
    expect(sendVerificationCodeEmail).toHaveBeenCalledTimes(1);

    const emailCall = sendVerificationCodeEmail.mock.calls[0][0];
    expect(emailCall.to).toBe(registerResponse.body.email);
    expect(emailCall.code).toMatch(/^\d{6}$/);

    const loginBeforeVerify = await request(app)
      .post('/api/auth/login')
      .send({
        email: registerResponse.body.email,
        password: 'StrongPass1!',
      });

    expect(loginBeforeVerify.status).toBe(403);
    expect(loginBeforeVerify.body.message).toMatch(/verifier votre adresse email/i);

    const verifyResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({
        email: registerResponse.body.email,
        code: emailCall.code,
      });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.token).toBeDefined();
    expect(verifyResponse.body.user.emailVerified).toBe(true);

    const loginAfterVerify = await request(app)
      .post('/api/auth/login')
      .send({
        email: registerResponse.body.email,
        password: 'StrongPass1!',
      });

    expect(loginAfterVerify.status).toBe(200);
    expect(loginAfterVerify.body.token).toBeDefined();
  });

  test('resend verification code sends a new code for pending users', async () => {
    const registerResponse = await registerStudent({
      email: `pending_${Date.now()}@test.com`,
    });

    const initialCode = sendVerificationCodeEmail.mock.calls[0][0].code;

    const resendResponse = await request(app)
      .post('/api/auth/resend-verification-code')
      .send({
        email: registerResponse.body.email,
      });

    expect(resendResponse.status).toBe(200);
    expect(resendResponse.body.message).toMatch(/envoye/i);
    expect(sendVerificationCodeEmail).toHaveBeenCalledTimes(2);

    const resentCode = sendVerificationCodeEmail.mock.calls[1][0].code;
    expect(resentCode).toMatch(/^\d{6}$/);
    expect(resentCode).not.toBe(initialCode);
  });
});
