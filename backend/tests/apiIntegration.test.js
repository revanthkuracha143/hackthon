const request = require('supertest');
const app = require('../src/server');

describe('API Doctor End-to-End API Integration', () => {
  let workspaceId;

  test('POST /api/projects/demo should load demo broken project', async () => {
    const res = await request(app).post('/api/projects/demo');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.workspaceId).toBeDefined();
    workspaceId = res.body.workspaceId;
  });

  test('POST /api/projects/:id/analyze should inspect demo project', async () => {
    const res = await request(app).post(`/api/projects/${workspaceId}/analyze`);
    expect(res.statusCode).toBe(200);
    expect(res.body.analysis.framework).toBe('Express');
    expect(res.body.analysis.entryPoint).toBe('server.js');
  });

  test('POST /api/projects/:id/test should run API and capture HTTP failure', async () => {
    const res = await request(app).post(`/api/projects/${workspaceId}/test`);
    expect(res.statusCode).toBe(200);
    expect(res.body.summary.failed).toBeGreaterThan(0);
    expect(res.body.results.some(r => r.result === 'FAILED')).toBe(true);
  }, 15000);

  test('POST /api/projects/:id/diagnose should return AI root cause diagnosis', async () => {
    const res = await request(app)
      .post(`/api/projects/${workspaceId}/diagnose`)
      .send({ endpointPath: '/api/users/1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.diagnosis.problematicCode).toBeDefined();
    expect(res.body.diagnosis.suggestedCode).toBeDefined();
  }, 15000);

  test('POST /api/projects/:id/apply-fix should apply fix to temporary copy', async () => {
    const res = await request(app).post(`/api/projects/${workspaceId}/apply-fix`);
    expect(res.statusCode).toBe(200);
    expect(res.body.result.success).toBe(true);
  });

  test('POST /api/projects/:id/verify should retest patched API and output verified=true', async () => {
    const res = await request(app).post(`/api/projects/${workspaceId}/verify`);
    expect(res.statusCode).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.verification.before.status).toBe(500);
    expect(res.body.verification.after.status).toBe(200);
  }, 15000);
});
