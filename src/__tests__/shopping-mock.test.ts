import { describe, test, it, expect, jest } from '@jest/globals';
import { Hono } from 'hono';

// Create a minimal test server
const createTestServer = () => {
  const app = new Hono();
  
  app.get('/health', (c) => c.json({ status: 'ok' }));
  
  app.get('/api/families/:familyId/shopping', (c) => {
    return c.json([{
      id: '123',
      name: 'Test Item',
      quantity: 1,
      purchased: false,
      familyId: c.req.param('familyId'),
      userId: '789',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }]);
  });
  
  return app;
};

describe('Shopping Mock Test', () => {
  const app = createTestServer();
  const familyId = '456';

  it('should get shopping items', async () => {
    const req = new Request(`http://localhost/api/families/${familyId}/shopping`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    const response = await app.fetch(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].name).toBe('Test Item');
    expect(body[0].familyId).toBe(familyId);
  });

  it('should respond to health check', async () => {
    const req = new Request('http://localhost/health');
    const response = await app.fetch(req);
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body).toEqual({ status: 'ok' });
  });
});
