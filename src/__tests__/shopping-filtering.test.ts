import { describe, test, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from '../../server';
import { PrismaClient } from '@prisma/client';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
  familyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const prisma = new PrismaClient();
const app = createServer();
let familyId: string;
let userId: string;

beforeAll(async () => {
  // Generate IDs
  familyId = crypto.randomUUID();
  userId = crypto.randomUUID();

  // Create test data
  await prisma.$executeRaw`
    INSERT INTO Family (id, name, createdAt, updatedAt)
    VALUES (${familyId}, 'Test Family', datetime('now'), datetime('now'))
  `;

  await prisma.$executeRaw`
    INSERT INTO User (id, email, password, firstName, lastName, username, role, familyId, createdAt, updatedAt)
    VALUES (${userId}, 'test@example.com', 'password123', 'Test', 'User', 'testuser', 'MEMBER', ${familyId}, datetime('now'), datetime('now'))
  `;

  // Create test items with different purchase statuses
  await prisma.$executeRaw`
    INSERT INTO ShoppingItem (id, name, quantity, purchased, familyId, userId, createdAt, updatedAt)
    VALUES 
      (${crypto.randomUUID()}, 'Purchased Item', 1, 1, ${familyId}, ${userId}, datetime('now'), datetime('now')),
      (${crypto.randomUUID()}, 'Unpurchased Item 1', 2, 0, ${familyId}, ${userId}, datetime('now'), datetime('now')),
      (${crypto.randomUUID()}, 'Unpurchased Item 2', 3, 0, ${familyId}, ${userId}, datetime('now'), datetime('now'))
  `;
});

afterAll(async () => {
  await prisma.$executeRaw`DELETE FROM ShoppingItem`;
  await prisma.$executeRaw`DELETE FROM User`;
  await prisma.$executeRaw`DELETE FROM Family`;
  await prisma.$disconnect();
});

describe('Shopping Item Filtering', () => {
  it('should filter purchased items', async () => {
    const response = await app.fetch(new Request(
      `http://localhost/api/families/${familyId}/shopping?purchased=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }
    ));

    const body = await response.json() as ShoppingItem[];
    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].purchased).toBe(true);
  });

  it('should filter unpurchased items', async () => {
    const response = await app.fetch(new Request(
      `http://localhost/api/families/${familyId}/shopping?purchased=false`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }
    ));

    const body = await response.json() as ShoppingItem[];
    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    body.forEach(item => {
      expect(item.purchased).toBe(false);
    });
  });

  it('should sort items by name', async () => {
    const response = await app.fetch(new Request(
      `http://localhost/api/families/${familyId}/shopping?sortBy=name&order=asc`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }
    ));

    const body = await response.json() as ShoppingItem[];
    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    
    const names = body.map(item => item.name);
    expect(names).toEqual([...names].sort());
  });

  it('should sort items by quantity', async () => {
    const response = await app.fetch(new Request(
      `http://localhost/api/families/${familyId}/shopping?sortBy=quantity&order=desc`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }
    ));

    const body = await response.json() as ShoppingItem[];
    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    
    const quantities = body.map(item => item.quantity);
    expect(quantities).toEqual([...quantities].sort((a, b) => b - a));
  });
});
