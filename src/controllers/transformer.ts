import type { ShoppingItemWithLists, TransformedShoppingItem } from './types';

export function transformShoppingItem(item: {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
  userId: string;
  familyId: string;
  createdAt: Date;
  updatedAt: Date;
  shoppingListItems?: Array<{
    list: {
      id: string;
      name: string;
      familyId: string;
    }
  }>;
}): TransformedShoppingItem {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    purchased: item.purchased,
    userId: item.userId,
    familyId: item.familyId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lists: (item.shoppingListItems || []).map(item => ({
      list: {
        id: item.list.id,
        name: item.list.name,
        familyId: item.list.familyId
      }
    }))
  };
}
