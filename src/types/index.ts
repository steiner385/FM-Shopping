import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Shopping List Status Enum
export enum ShoppingListStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

// Shopping Item Status Enum
export enum ShoppingItemStatus {
  PENDING = 'PENDING',
  PURCHASED = 'PURCHASED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  CANCELLED = 'CANCELLED'
}

// Configuration Schema
export const ShoppingConfigSchema = z.object({
  features: z.object({
    itemPrioritization: z.boolean().default(true),
    budgetTracking: z.boolean().default(false),
    categoryManagement: z.boolean().default(true)
  }),
  roles: z.object({
    canCreateLists: z.array(z.string()).default(['PARENT', 'CHILD']),
    canEditLists: z.array(z.string()).default(['PARENT', 'CHILD']),
    canDeleteLists: z.array(z.string()).default(['PARENT'])
  }),
  limits: z.object({
    maxListsPerUser: z.number().min(1).default(10),
    maxItemsPerList: z.number().min(1).default(50),
    maxCategoriesPerList: z.number().min(1).default(10)
  })
});

// Derived Types
export type ShoppingConfig = z.infer<typeof ShoppingConfigSchema>;

// Interfaces for Domain Models
export interface ShoppingList {
  id: string;
  title: string;
  description?: string;
  status: ShoppingListStatus;
  userId: string;
  familyId: string;
  totalEstimatedCost?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  items?: ShoppingItem[];
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit?: string;
  status: ShoppingItemStatus;
  estimatedPrice?: number;
  priority?: number;
  category?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingCategory {
  id: string;
  name: string;
  userId: string;
  familyId: string;
  color?: string;
  icon?: string;
}

// Type Guards and Utility Functions
export function isValidShoppingListStatus(status: unknown): status is ShoppingListStatus {
  return typeof status === 'string' && 
         Object.values(ShoppingListStatus).includes(status as ShoppingListStatus);
}

export function isValidShoppingItemStatus(status: unknown): status is ShoppingItemStatus {
  return typeof status === 'string' && 
         Object.values(ShoppingItemStatus).includes(status as ShoppingItemStatus);
}

export function convertShoppingListStatusForPrisma(
  status: unknown
): Prisma.Enumerable<Prisma.ShoppingListStatusFilter> | undefined {
  if (status === undefined || status === null) return undefined;
  
  if (!isValidShoppingListStatus(status)) {
    throw new Error(`Invalid ShoppingListStatus: ${String(status)}`);
  }
  
  return {
    equals: status
  };
}

// Event Types
export type ShoppingEventType = 
  | 'shopping.list.created'
  | 'shopping.list.updated'
  | 'shopping.list.deleted'
  | 'shopping.item.added'
  | 'shopping.item.updated'
  | 'shopping.item.purchased'
  | 'shopping.list.shared';

// Utility Types
export type Optional<T> = T | null | undefined;
export type Nullable<T> = T | null;

// Validation Utilities
export function validateShoppingConfig(config: unknown): ShoppingConfig {
  return ShoppingConfigSchema.parse(config);
}