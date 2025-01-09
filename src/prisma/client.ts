import { PrismaClient, Prisma } from '@prisma/client';
import { ShoppingList, ShoppingItem, ShoppingListItem } from '../types';

interface ShoppingListResult extends ShoppingList {
  items: (ShoppingListItem & {
    item: ShoppingItem;
  })[];
}

interface ShoppingItemResult extends ShoppingItem {
  lists: (ShoppingListItem & {
    list: ShoppingList;
  })[];
}

interface CountResult {
  count: string | number;
}

export class CustomPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error']
    });
  }

  async findListById(id: string, includeItems = true): Promise<ShoppingListResult | null> {
    const result = await this.$queryRaw<ShoppingListResult[]>`
      SELECT 
        l.*,
        json_group_array(json_object(
          'id', li.id,
          'listId', li.listId,
          'itemId', li.itemId,
          'item', json_object(
            'id', i.id,
            'name', i.name,
            'quantity', i.quantity,
            'purchased', i.purchased,
            'createdAt', i.createdAt,
            'updatedAt', i.updatedAt,
            'userId', i.userId,
            'familyId', i.familyId
          )
        )) as items
      FROM "ShoppingList" l
      LEFT JOIN "ShoppingListItem" li ON l.id = li.listId
      LEFT JOIN "ShoppingItem" i ON li.itemId = i.id
      WHERE l.id = ${id}
      GROUP BY l.id
      LIMIT 1
    `;

    if (!result[0]) return null;

    const list = result[0];
    if (includeItems) {
      list.items = JSON.parse(list.items as unknown as string)
        .filter((i: any) => i.id !== null);
    }

    return list;
  }

  async findListsByFamily(familyId: string, includeItems = true): Promise<ShoppingListResult[]> {
    const result = await this.$queryRaw<ShoppingListResult[]>`
      SELECT 
        l.*,
        json_group_array(json_object(
          'id', li.id,
          'listId', li.listId,
          'itemId', li.itemId,
          'item', json_object(
            'id', i.id,
            'name', i.name,
            'quantity', i.quantity,
            'purchased', i.purchased,
            'createdAt', i.createdAt,
            'updatedAt', i.updatedAt,
            'userId', i.userId,
            'familyId', i.familyId
          )
        )) as items
      FROM "ShoppingList" l
      LEFT JOIN "ShoppingListItem" li ON l.id = li.listId
      LEFT JOIN "ShoppingItem" i ON li.itemId = i.id
      WHERE l.familyId = ${familyId}
      GROUP BY l.id
    `;

    if (includeItems) {
      return result.map(list => ({
        ...list,
        items: JSON.parse(list.items as unknown as string)
          .filter((i: any) => i.id !== null)
      }));
    }

    return result;
  }

  async findItemById(id: string, includeLists = true): Promise<ShoppingItemResult | null> {
    const result = await this.$queryRaw<ShoppingItemResult[]>`
      SELECT 
        i.*,
        json_group_array(json_object(
          'id', li.id,
          'listId', li.listId,
          'itemId', li.itemId,
          'list', json_object(
            'id', l.id,
            'name', l.name,
            'description', l.description,
            'createdAt', l.createdAt,
            'updatedAt', l.updatedAt,
            'familyId', l.familyId
          )
        )) as lists
      FROM "ShoppingItem" i
      LEFT JOIN "ShoppingListItem" li ON i.id = li.itemId
      LEFT JOIN "ShoppingList" l ON li.listId = l.id
      WHERE i.id = ${id}
      GROUP BY i.id
      LIMIT 1
    `;

    if (!result[0]) return null;

    const item = result[0];
    if (includeLists) {
      item.lists = JSON.parse(item.lists as unknown as string)
        .filter((l: any) => l.id !== null);
    }

    return item;
  }

  async findItemsByFamily(familyId: string, includeLists = true): Promise<ShoppingItemResult[]> {
    const result = await this.$queryRaw<ShoppingItemResult[]>`
      SELECT 
        i.*,
        json_group_array(json_object(
          'id', li.id,
          'listId', li.listId,
          'itemId', li.itemId,
          'list', json_object(
            'id', l.id,
            'name', l.name,
            'description', l.description,
            'createdAt', l.createdAt,
            'updatedAt', l.updatedAt,
            'familyId', l.familyId
          )
        )) as lists
      FROM "ShoppingItem" i
      LEFT JOIN "ShoppingListItem" li ON i.id = li.itemId
      LEFT JOIN "ShoppingList" l ON li.listId = l.id
      WHERE i.familyId = ${familyId}
      GROUP BY i.id
    `;

    if (includeLists) {
      return result.map(item => ({
        ...item,
        lists: JSON.parse(item.lists as unknown as string)
          .filter((l: any) => l.id !== null)
      }));
    }

    return result;
  }

  async createList(data: {
    name: string;
    description?: string;
    familyId: string;
    items?: string[];
  }): Promise<ShoppingListResult> {
    return this.$transaction(async (tx) => {
      // Create list
      const list = await tx.$queryRaw<ShoppingListResult[]>`
        INSERT INTO "ShoppingList" (
          id,
          name,
          description,
          familyId,
          createdAt,
          updatedAt
        ) VALUES (
          uuid_generate_v4(),
          ${data.name},
          ${data.description || null},
          ${data.familyId},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      if (!list[0]) {
        throw new Error('Failed to create shopping list');
      }

      // Add items if provided
      if (data.items?.length) {
        for (const itemId of data.items) {
          await tx.$queryRaw`
            INSERT INTO "ShoppingListItem" (
              id,
              listId,
              itemId
            ) VALUES (
              uuid_generate_v4(),
              ${list[0].id},
              ${itemId}
            )
          `;
        }
      }

      // Return list with items
      return this.findListById(list[0].id) as Promise<ShoppingListResult>;
    });
  }

  async createItem(data: {
    name: string;
    quantity?: number;
    userId: string;
    familyId: string;
  }): Promise<ShoppingItem> {
    const result = await this.$queryRaw<ShoppingItem[]>`
      INSERT INTO "ShoppingItem" (
        id,
        name,
        quantity,
        purchased,
        userId,
        familyId,
        createdAt,
        updatedAt
      ) VALUES (
        uuid_generate_v4(),
        ${data.name},
        ${data.quantity || 1},
        false,
        ${data.userId},
        ${data.familyId},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Failed to create shopping item');
    }

    return result[0];
  }

  async updateList(id: string, data: Partial<{
    name: string;
    description: string | null;
    items: string[];
  }>): Promise<ShoppingListResult> {
    return this.$transaction(async (tx) => {
      // Update list
      const setClauses: Prisma.Sql[] = [];
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'items') {
          setClauses.push(Prisma.sql`"${Prisma.raw(key)}" = ${value}`);
        }
      });

      if (setClauses.length > 0) {
        await tx.$queryRaw`
          UPDATE "ShoppingList"
          SET ${Prisma.join(setClauses, ', ')}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `;
      }

      // Update items if provided
      if (data.items) {
        // Remove existing items
        await tx.$queryRaw`DELETE FROM "ShoppingListItem" WHERE listId = ${id}`;

        // Add new items
        for (const itemId of data.items) {
          await tx.$queryRaw`
            INSERT INTO "ShoppingListItem" (
              id,
              listId,
              itemId
            ) VALUES (
              uuid_generate_v4(),
              ${id},
              ${itemId}
            )
          `;
        }
      }

      // Return updated list
      const list = await this.findListById(id);
      if (!list) {
        throw new Error('Failed to update shopping list');
      }
      return list;
    });
  }

  async updateItem(id: string, data: Partial<{
    name: string;
    quantity: number;
    purchased: boolean;
  }>): Promise<ShoppingItem> {
    const setClauses: Prisma.Sql[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        setClauses.push(Prisma.sql`"${Prisma.raw(key)}" = ${value}`);
      }
    });

    const result = await this.$queryRaw<ShoppingItem[]>`
      UPDATE "ShoppingItem"
      SET ${Prisma.join(setClauses, ', ')}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Failed to update shopping item');
    }

    return result[0];
  }

  async deleteList(id: string): Promise<ShoppingList> {
    const result = await this.$queryRaw<ShoppingList[]>`
      DELETE FROM "ShoppingList"
      WHERE id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Shopping list not found');
    }

    return result[0];
  }

  async deleteItem(id: string): Promise<ShoppingItem> {
    const result = await this.$queryRaw<ShoppingItem[]>`
      DELETE FROM "ShoppingItem"
      WHERE id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Shopping item not found');
    }

    return result[0];
  }

  async countLists(where?: {
    familyId?: string;
    hasItems?: boolean;
  }): Promise<number> {
    const conditions: Prisma.Sql[] = [];

    if (where?.familyId) {
      conditions.push(Prisma.sql`l."familyId" = ${where.familyId}`);
    }

    if (where?.hasItems) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "ShoppingListItem" li 
        WHERE li.listId = l.id
      )`);
    }

    const whereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const [result] = await this.$queryRaw<[CountResult]>`
      SELECT COUNT(*) as count 
      FROM "ShoppingList" l
      ${whereClause}
    `;

    return Number(result.count);
  }

  async countItems(where?: {
    familyId?: string;
    purchased?: boolean;
    listId?: string;
  }): Promise<number> {
    const conditions: Prisma.Sql[] = [];

    if (where?.familyId) {
      conditions.push(Prisma.sql`i."familyId" = ${where.familyId}`);
    }

    if (where?.purchased !== undefined) {
      conditions.push(Prisma.sql`i.purchased = ${where.purchased}`);
    }

    if (where?.listId) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "ShoppingListItem" li 
        WHERE li.itemId = i.id AND li.listId = ${where.listId}
      )`);
    }

    const whereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    const [result] = await this.$queryRaw<[CountResult]>`
      SELECT COUNT(*) as count 
      FROM "ShoppingItem" i
      ${whereClause}
    `;

    return Number(result.count);
  }
}

export const prisma = new CustomPrismaClient();
