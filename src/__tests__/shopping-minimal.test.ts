import { describe, test, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from '../../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createServer();
let familyId: string;
let userId: string;

beforeAll(async () => {
  // Generate IDs
  familyId = crypto.randomUUID();
  userId = crypto.randomUUID();

  // Create minimal test data
  await prisma.$executeRaw`
    INSERT INTO Family (id, name, createdAt, updatedAt)
    VALUES (${familyId}, 'Test Family', datetime('now'), datetime('now'))
  `;

  await prisma.$executeRaw`
    INSERT INTO User (id, email, password, firstName, lastName, username, role, familyId, createdAt, updatedAt)
    VALUES (${userId}, 'test@example.com', 'password123', 'Test', 'User', 'testuser', 'MEMBER', ${familyId}, datetime('now'), datetime('now'))
  `;

  await prisma.$executeRaw`
    INSERT INTO ShoppingItem (id, name, quantity, purchased, familyId, userId, createdAt, updatedAt)
    VALUES (${crypto.randomUUID()}, 'Test Item', 1, 0, ${familyId}, ${userId}, datetime('now'), datetime('now'))
  `;
});

afterAll(async () => {
  await prisma.$executeRaw`DELETE FROM ShoppingItem`;
  await prisma.$executeRaw`DELETE FROM User`;
  await prisma.$executeRaw`DELETE FROM Family`;
  await prisma.$disconnect();
});

describe('Server Tests', () => {
  it('should respond to health check', async () => {
    const req = new Request('http://localhost/health', {
      method: 'GET'
    });

    const response = await app.fetch(req);
    const responseText = await response.text();
    console.log('Health Response:', response.status, responseText);

    try {
      const body = JSON.parse(responseText);
      expect(response.status).toBe(200);
      expect(body).toEqual({ status: 'ok' });
    } catch (error) {
      console.error('Failed to parse response:', error);
      throw error;
    }
  });

  it('should get shopping items', async () => {
    const req = new Request(`http://localhost/api/families/${familyId}/shopping`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    const response = await app.fetch(req);
    const responseText = await response.text();
    console.log('Shopping Response:', response.status, responseText);

    try {
      const body = JSON.parse(responseText);
      expect(response.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
    } catch (error) {
      console.error('Failed to parse response:', error);
      throw error;
    }
  });
});
