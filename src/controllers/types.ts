export interface ShoppingList {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  familyId: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
  createdAt: Date;
  updatedAt: Date;
  familyId: string;
  userId: string;
}

export interface ShoppingListItem {
  id: string;
  listId: string;
  itemId: string;
  list: ShoppingList;
}

export interface ShoppingItemWithLists extends ShoppingItem {
  lists: ShoppingListItem[];
}
