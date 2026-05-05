import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
  });

  it('responds with HTML', async () => {
    const res = await request(app).get('/');
    assert.match(res.headers['content-type'], /text\/html/);
  });

  it('contains Hello World', async () => {
    const res = await request(app).get('/');
    assert.match(res.text, /Hello World/);
  });

  it('contains a description paragraph', async () => {
    const res = await request(app).get('/');
    assert.match(res.text, /AI-Implement/);
  });
});

describe('unknown routes', () => {
  it('GET /unknown returns 404', async () => {
    const res = await request(app).get('/unknown');
    assert.equal(res.status, 404);
  });
});
