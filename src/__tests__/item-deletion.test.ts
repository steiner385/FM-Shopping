import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { Response } from 'supertest';
import { setupShoppingTest, cleanupShoppingTest, type ShoppingTestContext } from './shopping-test-setup.js';

describe('Shopping Item Deletion', () => {
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
        listNames: ['Test List']
      });
    itemId = createResponse.body.id;
  });

  it('should delete shopping item', async () => {
    const response: Response = await context.agent
      .delete(`/api/families/${context.familyId}/shopping/${itemId}`)
      .set('Authorization', `Bearer ${context.memberToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Item deleted successfully');

    // Verify item is deleted
    const getResponse: Response = await context.agent
      .get(`/api/families/${context.familyId}/shopping`)
      .set('Authorization', `Bearer ${context.memberToken}`);
    expect(getResponse.body).toHaveLength(0);
  });
});
