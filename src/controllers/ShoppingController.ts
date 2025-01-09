import { Context } from 'hono';
import { CustomPrismaClient } from '../prisma/client';
import { ShoppingError } from '../errors/ShoppingError';
import { CreateShoppingListInput, UpdateShoppingListInput, CreateShoppingItemInput, UpdateShoppingItemInput } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { z } from 'zod';

interface UserContext {
  id: string;
  role: string;
  familyId: string;
}

interface RequestContext extends Context {
  get(key: 'user'): UserContext;
}

const listSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string()
  })).optional()
});

const itemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(1).optional(),
  purchased: z.boolean().optional()
});

export class ShoppingController {
  constructor(private readonly prisma: CustomPrismaClient) {}

  async getLists(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const lists = await this.prisma.findListsByFamily(user.familyId);
      return successResponse(c, lists);
    } catch (error) {
      console.error('Get lists error:', error);
      return errorResponse(c, error);
    }
  }

  async getListById(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const { id } = c.req.param();

      const list = await this.prisma.findListById(id);
      if (!list) {
        throw new ShoppingError({
          code: 'LIST_NOT_FOUND',
          message: 'Shopping list not found'
        });
      }

      // Verify access
      if (list.familyId !== user.familyId) {
        throw new ShoppingError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this shopping list'
        });
      }

      return successResponse(c, list);
    } catch (error) {
      console.error('Get list error:', error);
      return errorResponse(c, error);
    }
  }

  async createList(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const data = await c.req.json() as CreateShoppingListInput;

      // Validate list data
      const validatedData = listSchema.parse(data);

      // Create list
      const list = await this.prisma.createList({
        ...validatedData,
        familyId: user.familyId,
        items: validatedData.items?.map(i => i.itemId)
      });

      return successResponse(c, list, 201);
    } catch (error) {
      console.error('Create list error:', error);
      return errorResponse(c, error);
    }
  }

  async updateList(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const { id } = c.req.param();
      const data = await c.req.json() as UpdateShoppingListInput;

      // Verify list exists and user has access
      const existingList = await this.prisma.findListById(id);
      if (!existingList) {
        throw new ShoppingError({
          code: 'LIST_NOT_FOUND',
          message: 'Shopping list not found'
        });
      }

      if (existingList.familyId !== user.familyId) {
        throw new ShoppingError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this list'
        });
      }

      // Validate list data
      const validatedData = listSchema.partial().parse(data);

      // Update list
      const updatedList = await this.prisma.updateList(id, {
        ...validatedData,
        items: validatedData.items?.map(i => i.itemId)
      });

      return successResponse(c, updatedList);
    } catch (error) {
      console.error('Update list error:', error);
      return errorResponse(c, error);
    }
  }

  async deleteList(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const { id } = c.req.param();

      // Verify list exists and user has access
      const list = await this.prisma.findListById(id);
      if (!list) {
        throw new ShoppingError({
          code: 'LIST_NOT_FOUND',
          message: 'Shopping list not found'
        });
      }

      if (list.familyId !== user.familyId) {
        throw new ShoppingError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this list'
        });
      }

      await this.prisma.deleteList(id);
      return successResponse(c, { message: 'Shopping list deleted successfully' });
    } catch (error) {
      console.error('Delete list error:', error);
      return errorResponse(c, error);
    }
  }

  async getItems(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const items = await this.prisma.findItemsByFamily(user.familyId);
      return successResponse(c, items);
    } catch (error) {
      console.error('Get items error:', error);
      return errorResponse(c, error);
    }
  }

  async getItemById(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const { id } = c.req.param();

      const item = await this.prisma.findItemById(id);
      if (!item) {
        throw new ShoppingError({
          code: 'ITEM_NOT_FOUND',
          message: 'Shopping item not found'
        });
      }

      // Verify access
      if (item.familyId !== user.familyId) {
        throw new ShoppingError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this shopping item'
        });
      }

      return successResponse(c, item);
    } catch (error) {
      console.error('Get item error:', error);
      return errorResponse(c, error);
    }
  }

  async createItem(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const data = await c.req.json() as CreateShoppingItemInput;

      // Validate item data
      const validatedData = itemSchema.parse(data);

      // Create item
      const item = await this.prisma.createItem({
        ...validatedData,
        userId: user.id,
        familyId: user.familyId
      });

      return successResponse(c, item, 201);
    } catch (error) {
      console.error('Create item error:', error);
      return errorResponse(c, error);
    }
  }

  async updateItem(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const { id } = c.req.param();
      const data = await c.req.json() as UpdateShoppingItemInput;

      // Verify item exists and user has access
      const existingItem = await this.prisma.findItemById(id);
      if (!existingItem) {
        throw new ShoppingError({
          code: 'ITEM_NOT_FOUND',
          message: 'Shopping item not found'
        });
      }

      if (existingItem.familyId !== user.familyId) {
        throw new ShoppingError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this item'
        });
      }

      // Validate item data
      const validatedData = itemSchema.partial().parse(data);

      // Update item
      const updatedItem = await this.prisma.updateItem(id, validatedData);
      return successResponse(c, updatedItem);
    } catch (error) {
      console.error('Update item error:', error);
      return errorResponse(c, error);
    }
  }

  async deleteItem(c: RequestContext): Promise<Response> {
    try {
      const user = c.get('user');
      const { id } = c.req.param();

      // Verify item exists and user has access
      const item = await this.prisma.findItemById(id);
      if (!item) {
        throw new ShoppingError({
          code: 'ITEM_NOT_FOUND',
          message: 'Shopping item not found'
        });
      }

      if (item.familyId !== user.familyId) {
        throw new ShoppingError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this item'
        });
      }

      await this.prisma.deleteItem(id);
      return successResponse(c, { message: 'Shopping item deleted successfully' });
    } catch (error) {
      console.error('Delete item error:', error);
      return errorResponse(c, error);
    }
  }

  async handleFamilyUpdated(data: { familyId: string }): Promise<void> {
    try {
      // Update shopping list access based on family membership changes
      // This is a placeholder for any family update logic
      console.log('Family updated:', data);
    } catch (error) {
      console.error('Handle family updated error:', error);
      throw error;
    }
  }
}
