import { Context } from 'hono';
import { prisma } from '../../../lib/prisma';
import { getUserFromToken } from '../../../utils/auth';
import type { ShoppingList } from '@prisma/client';

export class ShoppingListController {
  static async getListNames(c: Context): Promise<Response> {
    try {
      const user = await getUserFromToken(c);
      if (!user) {
        return c.json({ error: { message: 'Unauthorized' } }, 401);
      }

      const familyId = c.req.param('familyId');

      // Verify user's family access
      const userWithFamily = await prisma.user.findFirst({
        where: {
          id: user.userId,
          familyId: familyId
        }
      });

      if (!userWithFamily) {
        return c.json({ error: { message: 'Forbidden' } }, 403);
      }

      // Get all lists for the family
      const lists = await prisma.shoppingList.findMany({
        where: { familyId },
        select: { name: true },
        orderBy: { name: 'asc' }
      });

      return c.json(lists.map((list: { name: string }) => list.name));
    } catch (error: unknown) {
      console.error('Get list names error:', error);
      return c.json({ error: { message: 'Failed to get list names' } }, 500);
    }
  }
}
