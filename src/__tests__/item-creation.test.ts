import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import type { Response } from 'supertest';
import { setupShoppingTest, cleanupShoppingTest, type ShoppingTestContext } from './shopping-test-setup.js';

describe('Shopping Item Creation', () => {
  let context: ShoppingTestContext;

  beforeAll(async () => {
    context = await setupShoppingTest();
  });

  afterAll(async () => {
    await cleanupShoppingTest();
  });

  beforeEach(async () => {
    await cleanupShoppingTest();
  });

  it('should create a new shopping item as a family member', async () => {
    const itemData = {
      name: 'Milk',
      quantity: 2,
      listNames: ['Groceries', 'Weekly']
    };

    const response: Response = await context.agent
      .post(`/api/families/${context.familyId}/shopping`)
      .set('Authorization', `Bearer ${context.memberToken}`)
      .send(itemData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(itemData.name);
    expect(response.body.quantity).toBe(itemData.quantity);
    expect(response.body.lists).toHaveLength(2);
    expect(response.body.lists.map((l: any) => l.list.name)).toEqual(expect.arrayContaining(itemData.listNames));
  });

  it('should not create item without family membership', async () => {
    const outsiderResponse = await context.agent
      .post('/api/users/register')
      .send({
        email: 'outsider@test.com',
        password: 'TestPass123!',
        firstName: 'Outsider',
        lastName: 'User',
        role: 'MEMBER'
      });

    const response: Response = await context.agent
      .post(`/api/families/${context.familyId}/shopping`)
      .set('Authorization', `Bearer ${outsiderResponse.body.token}`)
      .send({
        name: 'Test Item',
        listNames: ['Test List']
      });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Unauthorized');
  });

  it('should validate item data', async () => {
    const response: Response = await context.agent
      .post(`/api/families/${context.familyId}/shopping`)
      .set('Authorization', `Bearer ${context.memberToken}`)
      .send({
        name: '', // Empty name
        quantity: -1 // Invalid quantity
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
