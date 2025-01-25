import type { SuperTest, Test } from 'supertest';
import { setupTestContext, type TestContext } from '../../../__tests__/core/utils/test-setup.js';
import { prisma } from '../../../lib/prisma.js';

export interface ShoppingTestContext extends TestContext {
  familyId: string;
  memberToken: string;
  itemId?: string;
}

export interface ShoppingItemResponse {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
  userId: string;
  familyId: string;
  createdAt: string;
  updatedAt: string;
  lists: Array<{
    list: {
      id: string;
      name: string;
    }
  }>;
}

export async function setupShoppingTest(): Promise<ShoppingTestContext> {
  const context = await setupTestContext() as ShoppingTestContext;
  
  // Verify family membership
  const member = await prisma.user.findFirst({
    where: {
      id: context.memberId,
      familyId: context.familyId
    }
  });

  if (!member) {
    console.error('Test user is not a family member:', {
      userId: context.memberId,
      familyId: context.familyId
    });
    throw new Error('Test user is not properly associated with family');
  }

  return context;
}

export async function cleanupShoppingTest(): Promise<void> {
  await prisma.$transaction([
    prisma.shoppingListItem.deleteMany(),
    prisma.shoppingItem.deleteMany(),
    prisma.shoppingList.deleteMany()
  ]);
  await prisma.$disconnect();
}
