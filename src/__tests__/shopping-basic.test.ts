import { describe, test, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from '../../server';
import { prisma } from '../utils/jest-setup';

describe('Shopping Basic Test', () => {
  const app = createServer();
  let familyId: string;

  beforeEach(async () => {
    // Generate IDs
    familyId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const listId = crypto.randomUUID();
    const itemId = crypto.randomUUID();

    // Create test data
    await prisma.$executeRaw`
      INSERT INTO Family (id, name, createdAt, updatedAt)
      VALUES (${familyId}, 'Test Family', datetime('now'), datetime('now'))
    `;

    await prisma.$executeRaw`
      INSERT INTO User (id, email, password, firstName, lastName, username, role, familyId, createdAt, updatedAt)
      VALUES (${userId}, 'test@example.com', 'password123', 'Test', 'User', 'testuser', 'MEMBER', ${familyId}, datetime('now'), datetime('now'))
    `;

    await prisma.$executeRaw`
      INSERT INTO ShoppingList (id, name, familyId, createdAt, updatedAt)
      VALUES (${listId}, 'Test List', ${familyId}, datetime('now'), datetime('now'))
    `;

    await prisma.$executeRaw`
      INSERT INTO ShoppingItem (id, name, quantity, purchased, familyId, userId, createdAt, updatedAt)
      VALUES (${itemId}, 'Test Item', 1, 0, ${familyId}, ${userId}, datetime('now'), datetime('now'))
    `;

    await prisma.$executeRaw`
      INSERT INTO ShoppingListItem (id, listId, itemId)
      VALUES (${crypto.randomUUID()}, ${listId}, ${itemId})
    `;
  });

  afterEach(async () => {
    await prisma.$executeRaw`DELETE FROM ShoppingListItem`;
    await prisma.$executeRaw`DELETE FROM ShoppingItem`;
    await prisma.$executeRaw`DELETE FROM ShoppingList`;
    await prisma.$executeRaw`DELETE FROM User`;
    await prisma.$executeRaw`DELETE FROM Family`;
  });

  it('should get shopping items', async () => {
    const req = new Request(`http://localhost/api/families/${familyId}/shopping`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    const response = await app.fetch(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
  });
});
