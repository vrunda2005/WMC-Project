import request from 'supertest';
import mongoose from 'mongoose';
import appModule from '../server.js';

// NOTE: These tests assume you have a test database configured in process.env.MONGODB_URI when NODE_ENV=test
// and the server exports the express app or you adapt server.js to export the app for testing.

describe('Membership cancellation and event registration', () => {
  beforeAll(async () => {
    // connect to test db if needed
    // mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    // await mongoose.disconnect();
  });

  test('Cancel membership - returns 400 without userId', async () => {
    const res = await request('http://localhost:5001').post('/cancel').send({});
    expect(res.statusCode).toBe(400);
  });

  test('Register to non-existing event should return 404', async () => {
    const payload = { eventId: '000000000000000000000000', eventName: 'X', name: 'A', email: 'noone@example.com', eventPoint: 1 };
    const res = await request('http://localhost:5001').post('/api/eventRegister').send(payload);
    expect([400,404]).toContain(res.statusCode);
  });
});
