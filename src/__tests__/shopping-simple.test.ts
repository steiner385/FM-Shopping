import { describe, test, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from '../../server';
import { prisma } from '../utils/db';

describe('Shopping Simple Test', () => {
  const app = createServer();
  let familyId: string;

  beforeEach(async () => {
    // Create test data
    familyId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    // Create family
    await prisma.$executeRawUnsafe(
      'INSERT INTO Family (id, name, createdAt, updatedAt) VALUES (?, ?, datetime(), datetime())',
      familyId,
      'Test Family'
    );

    // Create user
    await prisma.$executeRawUnsafe(
      'INSERT INTO User (id, email, password, firstName, lastName, username, role, familyId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(), datetime())',
      userId,
      'test@example.com',
      'password123',
      'Test',
      'User',
      'testuser',
      'MEMBER',
      familyId
    );

    // Create shopping item
    await prisma.$executeRawUnsafe(
      'INSERT INTO ShoppingItem (id, name, quantity, purchased, familyId, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime(), datetime())',
      crypto.randomUUID(),
      'Test Item',
      1,
      0,
      familyId,
      userId
    );
  });

  afterEach(async () => {
    // Clean up in reverse order of dependencies
    await prisma.$executeRawUnsafe('DELETE FROM ShoppingItem WHERE familyId = ?', familyId);
    await prisma.$executeRawUnsafe('DELETE FROM User WHERE familyId = ?', familyId);
    await prisma.$executeRawUnsafe('DELETE FROM Family WHERE id = ?', familyId);
  });

  it('should get shopping items', async () => {
    const req = new Request(`http://localhost/api/families/${familyId}/shopping`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    const response = await app.fetch(req);
    expect(response.status).toBe(200);

    const text = await response.text();
    console.log('Response:', text);

    const body = JSON.parse(text);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
  });
});
