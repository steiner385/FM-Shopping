import { Context } from 'hono';
import { prisma } from '../../../lib/prisma';
import { getUserFromToken } from '../../../utils/auth';
import { transformShoppingItem } from './transformer';
import type { ShoppingItem, ShoppingList, ShoppingListItem, User } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import type {
  ShoppingItemWhereInput,
  ShoppingItemCreateInput,
  ShoppingItemUpdateInput,
  ShoppingItemWithLists,
  ShoppingItemInclude,
  TransformedShoppingItem,
  ShoppingListWhereUniqueInput
} from './types';

type ShoppingListItemWithList = ShoppingListItem & {
  list: ShoppingList;
};

export class ShoppingItemController {
  static async createItem(c: Context): Promise<Response> {
    try {
      const user = await getUserFromToken(c);
      if (!user) {
        return c.json({ error: { message: 'Unauthorized' } }, 401);
      }

      const familyId = c.req.param('familyId');
      const { name, quantity = 1, purchased = false, listNames } = await c.req.json();

      // Verify user's family access first
      const userWithFamily = await prisma.user.findFirst({
        where: {
          id: user.userId,
          familyId: familyId
        }
      });

      if (!userWithFamily) {
        return c.json({ error: { message: 'Unauthorized' } }, 401);
      }

      // Validate input
      if (!name || name.trim() === '') {
        return c.json({ error: { message: 'Name is required' } }, 400);
      }

      if (quantity < 0) {
        return c.json({ error: { message: 'Quantity must be non-negative' } }, 400);
      }

      if (!Array.isArray(listNames) || listNames.length === 0) {
        return c.json({ error: { message: 'At least one list name is required' } }, 400);
      }

      // Create or get shopping lists in a transaction
      const item = await prisma.$transaction(async (tx) => {
        const lists = await Promise.all(
          listNames.map(async (name: string) => {
            return await tx.shoppingList.upsert({
              where: {
                familyId_name: {
                  familyId,
                  name
                }
              },
              create: {
                name,
                familyId
              },
              update: {}
            });
          })
        );

        return await tx.shoppingItem.create({
          data: {
            name,
            quantity,
            purchased,
            userId: user.userId,
            familyId,
            shoppingListItems: {
              create: lists.map(list => ({
                listId: list.id
              }))
            }
          },
          include: {
            shoppingListItems: {
              include: {
                list: {
                  select: {
                    id: true,
                    name: true,
                    familyId: true
                  }
                }
              }
            }
          }
        });
      });

      return c.json(transformShoppingItem(item), 201);
    } catch (error: unknown) {
      console.error('Create item error:', error);
      return c.json({ error: { message: 'Failed to create item' } }, 500);
    }
  }

  static async updateItem(c: Context): Promise<Response> {
    try {
      const user = await getUserFromToken(c);
      if (!user) {
        return c.json({ error: { message: 'Unauthorized' } }, 401);
      }

      const familyId = c.req.param('familyId');
      const itemId = c.req.param('itemId');
      const { quantity, purchased, listNames } = await c.req.json();

      // Validate input
      if (quantity !== undefined && quantity < 0) {
        return c.json({ error: { message: 'Quantity must be non-negative' } }, 400);
      }

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

      // Verify item exists and belongs to family
      const existingItem = await prisma.shoppingItem.findFirst({
        where: {
          id: itemId,
          familyId
        }
      });

      if (!existingItem) {
        return c.json({ error: { message: 'Item not found' } }, 404);
      }

      // Update item
      const updateData: ShoppingItemUpdateInput = {
        ...(quantity !== undefined && { quantity }),
        ...(purchased !== undefined && { purchased })
      };

      let updatedItem;

      if (listNames) {
        // Update item and lists in a transaction
        updatedItem = await prisma.$transaction(async (tx) => {
          // Create or get lists
          const lists = await Promise.all(
            listNames.map(async (name: string) => {
              return await tx.shoppingList.upsert({
                where: {
                  familyId_name: {
                    familyId,
                    name
                  }
                },
                create: {
                  name,
                  familyId
                },
                update: {}
              });
            })
          );

          // Delete existing list relationships and create new ones
          await tx.shoppingListItem.deleteMany({
            where: { itemId: itemId }
          });

          return await tx.shoppingItem.update({
            where: { id: itemId },
            data: {
              ...updateData,
              shoppingListItems: {
                create: lists.map(list => ({
                  listId: list.id
                }))
              }
            },
            include: {
              shoppingListItems: {
                include: {
                  list: true
                }
              }
            }
          });
        });
      } else {
        updatedItem = await prisma.shoppingItem.update({
          where: { id: itemId },
          data: updateData,
          include: {
            shoppingListItems: {
              include: {
                list: true
              }
            }
          }
        });
      }

      return c.json(transformShoppingItem(updatedItem));
    } catch (error: unknown) {
      console.error('Update item error:', error);
      return c.json({ error: { message: 'Failed to update item' } }, 500);
    }
  }

  static async deleteItem(c: Context): Promise<Response> {
    try {
      const user = await getUserFromToken(c);
      if (!user) {
        return c.json({ error: { message: 'Unauthorized' } }, 401);
      }

      const familyId = c.req.param('familyId');
      const itemId = c.req.param('itemId');

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

      // Verify item exists and belongs to family
      const existingItem = await prisma.shoppingItem.findFirst({
        where: {
          id: itemId,
          familyId
        }
      });

      if (!existingItem) {
        return c.json({ error: { message: 'Item not found' } }, 404);
      }

      // Delete item
      await prisma.shoppingItem.delete({
        where: { id: itemId }
      });

      return c.json({ message: 'Item deleted successfully' });
    } catch (error: unknown) {
      console.error('Delete item error:', error);
      return c.json({ error: { message: 'Failed to delete item' } }, 500);
    }
  }

  static async getItems(c: Context): Promise<Response> {
    try {
      console.log('[ShoppingItem] Incoming request:', {
        path: c.req.path,
        method: c.req.method,
        query: c.req.query(),
        headers: c.req.header()
      });

      const user = await getUserFromToken(c);
      if (!user) {
        console.log('[ShoppingItem] Unauthorized request');
        return c.json({ error: { message: 'Unauthorized' } }, 401);
      }

      console.log('[ShoppingItem] Authenticated user:', {
        userId: user.userId,
        role: user.role
      });

      const familyId = c.req.param('familyId');
      const purchased = c.req.query('purchased');
      const listName = c.req.query('listName');
      const { sortBy = 'createdAt', order = 'desc' } = c.req.query();

      // Verify user's family access
      const userWithFamily = await prisma.user.findFirst({
        where: {
          id: user.userId,
          familyId
        }
      });

      if (!userWithFamily) {
        return c.json({ error: { message: 'Forbidden' } }, 403);
      }

      // Build where conditions
      const whereConditions: Prisma.ShoppingItemWhereInput[] = [
        {
          family: {
            id: familyId
          }
        }
      ];

      // Add purchased filter
      if (purchased !== undefined && purchased !== null && purchased !== '') {
        whereConditions.push({
          purchased: purchased === 'true'
        });
      }

      // Add list filter if specified
      if (listName) {
        whereConditions.push({
          shoppingListItems: {
            some: {
              list: {
                name: listName
              }
            }
          }
        });
      }

      // Add date filters
      const { createdAfter, createdBefore, updatedAfter, updatedBefore } = c.req.query();
      
      if (createdAfter || createdBefore) {
        const createdAtFilter: Prisma.ShoppingItemWhereInput = {
          createdAt: {
            ...(createdAfter && { gte: new Date(createdAfter) }),
            ...(createdBefore && { lte: new Date(createdBefore) })
          }
        };
        whereConditions.push(createdAtFilter);
      }

      if (updatedAfter || updatedBefore) {
        const updatedAtFilter: Prisma.ShoppingItemWhereInput = {
          updatedAt: {
            ...(updatedAfter && { gte: new Date(updatedAfter) }),
            ...(updatedBefore && { lte: new Date(updatedBefore) })
          }
        };
        whereConditions.push(updatedAtFilter);
      }

      const orderBy = {
        [sortBy]: order.toLowerCase()
      };

      const where: Prisma.ShoppingItemWhereInput = {
        AND: whereConditions
      };

      const items = await prisma.shoppingItem.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          },
          family: {
            select: {
              id: true,
              name: true
            }
          },
          shoppingListItems: {
            include: {
              list: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true
                }
              }
            }
          }
        },
        orderBy
      });

      return c.json(items.map((item) => transformShoppingItem({
        ...item,
        shoppingListItems: item.shoppingListItems.map(li => ({
          list: {
            id: li.list.id,
            name: li.list.name,
            familyId: item.familyId
          }
        }))
      })));
    } catch (error: unknown) {
      console.error('Get items error:', error);
      return c.json({ error: { message: 'Failed to get items' } }, 500);
    }
  }
}
