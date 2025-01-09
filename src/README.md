# Shopping Plugin

The Shopping plugin provides comprehensive shopping list management functionality for families, enabling collaborative shopping list creation, item tracking, and list organization.

## Features

- Shopping list creation and management
- Item categorization
- List sharing and collaboration
- Item status tracking
- List filtering and sorting
- Budget integration
- Item history tracking
- Multiple list support

## API Endpoints

### Shopping Lists

#### Create Shopping List
```http
POST /api/families/:familyId/shopping
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Weekly Groceries",
  "description": "Regular grocery items",
  "category": "GROCERIES",
  "priority": "HIGH"
}
```

#### Get Shopping List
```http
GET /api/families/:familyId/shopping/:listId
Authorization: Bearer {token}
```

#### List All Shopping Lists
```http
GET /api/families/:familyId/shopping/lists
Authorization: Bearer {token}
```

Query Parameters:
- `category`: Filter by list category
- `priority`: Filter by priority
- `status`: Filter by list status
- `createdBy`: Filter by creator
- `sortBy`: Sort field (name, createdAt, priority)
- `order`: Sort order (asc, desc)

### Shopping Items

#### Add Item to List
```http
POST /api/families/:familyId/shopping/:listId/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Milk",
  "quantity": 2,
  "unit": "GALLON",
  "category": "DAIRY",
  "priority": "HIGH",
  "notes": "2% fat"
}
```

#### Update Item
```http
PUT /api/families/:familyId/shopping/:itemId
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3,
  "status": "PURCHASED"
}
```

#### Delete Item
```http
DELETE /api/families/:familyId/shopping/:itemId
Authorization: Bearer {token}
```

#### List Items
```http
GET /api/families/:familyId/shopping/:listId/items
Authorization: Bearer {token}
```

Query Parameters:
- `status`: Filter by item status
- `category`: Filter by item category
- `priority`: Filter by priority
- `addedBy`: Filter by who added the item
- `sortBy`: Sort field (name, addedAt, priority)
- `order`: Sort order (asc, desc)

## Data Models

### Shopping List
```typescript
interface ShoppingList {
  id: string;
  name: string;
  description: string;
  category: ListCategory;
  priority: ListPriority;
  status: ListStatus;
  familyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

enum ListCategory {
  GROCERIES = 'GROCERIES',
  HOUSEHOLD = 'HOUSEHOLD',
  SCHOOL = 'SCHOOL',
  OTHER = 'OTHER'
}

enum ListPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

enum ListStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}
```

### Shopping Item
```typescript
interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: ItemUnit;
  category: ItemCategory;
  priority: ItemPriority;
  status: ItemStatus;
  notes?: string;
  price?: number;
  listId: string;
  familyId: string;
  addedBy: string;
  purchasedBy?: string;
  addedAt: Date;
  updatedAt: Date;
  purchasedAt?: Date;
}

enum ItemUnit {
  PIECE = 'PIECE',
  POUND = 'POUND',
  OUNCE = 'OUNCE',
  GALLON = 'GALLON',
  PACKAGE = 'PACKAGE'
}

enum ItemCategory {
  PRODUCE = 'PRODUCE',
  DAIRY = 'DAIRY',
  MEAT = 'MEAT',
  PANTRY = 'PANTRY',
  FROZEN = 'FROZEN',
  HOUSEHOLD = 'HOUSEHOLD'
}

enum ItemStatus {
  PENDING = 'PENDING',
  PURCHASED = 'PURCHASED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  SKIPPED = 'SKIPPED'
}
```

## Usage Examples

### Managing Shopping Lists
```typescript
import { ListController } from './controllers/list-controller';
import { ItemController } from './controllers/item-controller';

const listController = new ListController();
const itemController = new ItemController();

// Create a new shopping list
const newList = await listController.createList({
  name: "Weekly Groceries",
  description: "Regular grocery items",
  category: ListCategory.GROCERIES,
  priority: ListPriority.HIGH,
  familyId: "family123"
});

// Add items to the list
await itemController.addItem({
  listId: newList.id,
  name: "Milk",
  quantity: 2,
  unit: ItemUnit.GALLON,
  category: ItemCategory.DAIRY,
  priority: ItemPriority.HIGH,
  notes: "2% fat",
  familyId: "family123"
});
```

### Filtering Items
```typescript
// Get all pending high-priority items
const items = await itemController.listItems({
  listId: "list123",
  status: ItemStatus.PENDING,
  priority: ItemPriority.HIGH,
  sortBy: "priority",
  order: "desc"
});
```

## Testing

The Shopping plugin includes comprehensive test coverage:

### Test Files
- `shopping-test-setup.ts`: Test utilities and setup
- `item-creation.test.ts`: Item creation tests
- `item-update.test.ts`: Item update tests
- `item-deletion.test.ts`: Item deletion tests
- `item-listing.test.ts`: Item listing tests
- `shopping-filtering.test.ts`: List and item filtering tests
- `list-management.test.ts`: List management tests

### Running Tests
```bash
# Run all shopping plugin tests
npm test src/plugins/shopping

# Run specific test file
npm test src/plugins/shopping/__tests__/item-creation.test.ts
```

### Test Coverage
The test suite covers:
- List creation and management
- Item CRUD operations
- List and item filtering
- Status updates
- Authorization checks
- Error handling
- Edge cases

## Integration Points

The Shopping plugin integrates with other plugins:

- **Banking Plugin**: Track shopping expenses
- **Family Core**: Uses family membership for access control
- **Recipes Plugin**: Generate shopping lists from recipes

## Error Handling

The plugin includes comprehensive error handling:

```typescript
enum ShoppingError {
  LIST_NOT_FOUND = 'Shopping list not found',
  ITEM_NOT_FOUND = 'Shopping item not found',
  UNAUTHORIZED = 'User not authorized for this action',
  INVALID_STATUS = 'Invalid item status',
  INVALID_QUANTITY = 'Invalid item quantity',
  FAMILY_REQUIRED = 'Family ID is required',
  LIST_REQUIRED = 'List ID is required'
}
```

All API endpoints return appropriate HTTP status codes and error messages.

## Development Guidelines

1. Validate all input data
2. Include proper error handling
3. Maintain data consistency
4. Add tests for new functionality
5. Document API changes
6. Follow TypeScript best practices
7. Use proper authorization checks
8. Keep controllers and services separate
9. Maintain audit trail of changes
