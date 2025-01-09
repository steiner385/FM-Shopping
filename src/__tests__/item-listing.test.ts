import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { Response } from 'supertest';
import { setupShoppingTest, cleanupShoppingTest, type ShoppingTestContext } from './shopping-test-setup.js';
import { prisma } from '../../../__tests__/core/utils/jest-setup';

describe('Shopping Item Listing', () => {
  let context: ShoppingTestContext;

  beforeAll(async () => {
    context = await setupShoppingTest();
  });

  afterAll(async () => {
    await cleanupShoppingTest();
  });

  beforeEach(async () => {
    await cleanupShoppingTest();
    
    // Create multiple shopping items for testing
    await Promise.all([
      context.agent
        .post(`/api/families/${context.familyId}/shopping`)
        .set('Authorization', `Bearer ${context.memberToken}`)
        .send({
          name: 'Item 1',
          quantity: 1,
          listNames: ['Groceries']
        }),
      context.agent
        .post(`/api/families/${context.familyId}/shopping`)
        .set('Authorization', `Bearer ${context.memberToken}`)
        .send({
          name: 'Item 2',
          quantity: 2,
          listNames: ['Hardware']
        })
    ]);
  });

  it('should get all shopping items', async () => {
    const response: Response = await context.agent
      .get(`/api/families/${context.familyId}/shopping`)
      .set('Authorization', `Bearer ${context.memberToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('lists');
  });

  it('should filter items by list', async () => {
    const response: Response = await context.agent
      .get(`/api/families/${context.familyId}/shopping`)
      .query({ listName: 'Groceries' })
      .set('Authorization', `Bearer ${context.memberToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].lists[0].list.name).toBe('Groceries');
  });

  it('should filter items by purchased status', async () => {
    // First mark one item as purchased
    const items = await prisma.shoppingItem.findMany({
      where: { familyId: context.familyId }
    });
    await prisma.shoppingItem.update({
      where: { id: items[0].id },
      data: { purchased: true }
    });

    const response: Response = await context.agent
      .get(`/api/families/${context.familyId}/shopping`)
      .query({ purchased: 'true' })
      .set('Authorization', `Bearer ${context.memberToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].purchased).toBe(true);
  });
});
