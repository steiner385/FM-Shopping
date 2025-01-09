export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  familyId: string;
  items: ShoppingListItem[];
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
  lists?: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  listId: string;
  itemId: string;
  list?: ShoppingList;
  item?: ShoppingItem;
}

export interface CreateShoppingListInput {
  name: string;
  description?: string;
  items?: {
    itemId: string;
  }[];
}

export interface UpdateShoppingListInput {
  name?: string;
  description?: string;
  items?: {
    itemId: string;
  }[];
}

export interface CreateShoppingItemInput {
  name: string;
  quantity?: number;
}

export interface UpdateShoppingItemInput {
  name?: string;
  quantity?: number;
  purchased?: boolean;
}

export interface ShoppingListFilters {
  name?: string;
  hasItems?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ShoppingItemFilters {
  name?: string;
  purchased?: boolean;
  listId?: string;
}

export interface ShoppingListWithDetails extends ShoppingList {
  items: (ShoppingListItem & {
    item: ShoppingItem;
  })[];
}

export interface ShoppingItemWithLists extends ShoppingItem {
  lists: (ShoppingListItem & {
    list: ShoppingList;
  })[];
}
