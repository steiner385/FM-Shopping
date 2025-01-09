import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { Response } from 'supertest';
import { setupShoppingTest, cleanupShoppingTest, type ShoppingTestContext } from './shopping-test-setup.js';

describe('Shopping Item Update', () => {
  let context: ShoppingTestContext;
  let itemId: string;

  beforeAll(async () => {
    context = await setupShoppingTest();
  });

  afterAll(async () => {
    await cleanupShoppingTest();
  });

  beforeEach(async () => {
    await cleanupShoppingTest();
    
    // Create a shopping item for testing
    const createResponse: Response = await context.agent
      .post(`/api/families/${context.familyId}/shopping`)
      .set('Authorization', `Bearer ${context.memberToken}`)
      .send({
        name: 'Test Item',
        quantity: 1,
        listNames: ['Test List']
      });
    itemId = createResponse.body.id;
  });

  it('should update shopping item', async () => {
    const updateData = {
      quantity: 3,
      purchased: true,
      listNames: ['Updated List']
    };

    const response: Response = await context.agent
      .put(`/api/families/${context.familyId}/shopping/${itemId}`)
      .set('Authorization', `Bearer ${context.memberToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(updateData.quantity);
    expect(response.body.purchased).toBe(updateData.purchased);
    expect(response.body.lists).toHaveLength(1);
    expect(response.body.lists[0].list.name).toBe(updateData.listNames[0]);
  });

  it('should validate updated item data', async () => {
    const response: Response = await context.agent
      .put(`/api/families/${context.familyId}/shopping/${itemId}`)
      .set('Authorization', `Bearer ${context.memberToken}`)
      .send({
        quantity: -1 // Invalid quantity
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
