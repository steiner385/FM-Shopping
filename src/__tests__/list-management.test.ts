import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { Response } from 'supertest';
import { setupShoppingTest, cleanupShoppingTest, type ShoppingTestContext } from './shopping-test-setup.js';

describe('Shopping List Management', () => {
  let context: ShoppingTestContext;

  beforeAll(async () => {
    context = await setupShoppingTest();
  });

  afterAll(async () => {
    await cleanupShoppingTest();
  });

  beforeEach(async () => {
    await cleanupShoppingTest();
    
    // Create items with different lists
    await Promise.all([
      context.agent
        .post(`/api/families/${context.familyId}/shopping`)
        .set('Authorization', `Bearer ${context.memberToken}`)
        .send({
          name: 'Item 1',
          listNames: ['Groceries', 'Weekly']
        }),
      context.agent
        .post(`/api/families/${context.familyId}/shopping`)
        .set('Authorization', `Bearer ${context.memberToken}`)
        .send({
          name: 'Item 2',
          listNames: ['Hardware', 'Weekly']
        })
    ]);
  });

  it('should get all unique list names', async () => {
    const response: Response = await context.agent
      .get(`/api/families/${context.familyId}/shopping/lists`)
      .set('Authorization', `Bearer ${context.memberToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(3);
    expect(response.body).toEqual(expect.arrayContaining(['Groceries', 'Hardware', 'Weekly']));
  });
});
