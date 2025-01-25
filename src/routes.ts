import { Hono } from 'hono';
import { ShoppingListController } from '../controllers/ShoppingListController.js';
import { requireAuth } from '../utils/auth.js';

const router = new Hono();

// Add enhanced logging middleware for all shopping routes
router.use('*', async (c, next) => {
  const startTime = Date.now();
  console.log('[Shopping Routes] Incoming request:', {
    path: c.req.path,
    method: c.req.method,
    routePath: c.req.routePath,
    originalUrl: c.req.url,
    headers: c.req.header(),
    query: c.req.query(),
    params: c.req.param()
  });

  try {
    await next();
    const duration = Date.now() - startTime;
    console.log('[Shopping Routes] Request completed:', {
      path: c.req.path,
      method: c.req.method,
      duration: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Shopping Routes] Request failed:', {
      path: c.req.path,
      method: c.req.method,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

// Shopping list routes with logging
router.post('/shopping-lists', requireAuth(), async (c) => {
  console.log('[Shopping Routes] Create list request received');
  return await ShoppingListController.create(c);
});
router.post('/shopping-lists/:listId/items', requireAuth(), async (c) => {
  console.log('[Shopping Routes] Add item request received');
  return await ShoppingListController.addItem(c);
});

router.put('/shopping-lists/:listId/items/:itemId', requireAuth(), async (c) => {
  console.log('[Shopping Routes] Update item request received');
  return await ShoppingListController.updateItem(c);
});

router.delete('/shopping-lists/:listId/items/:itemId', requireAuth(), async (c) => {
  console.log('[Shopping Routes] Delete item request received');
  return await ShoppingListController.deleteItem(c);
});

router.get('/shopping-lists/:listId', requireAuth(), async (c) => {
  console.log('[Shopping Routes] Get list request received');
  return await ShoppingListController.getList(c);
});

router.get('/families/:familyId/shopping-lists', requireAuth(), async (c) => {
  console.log('[Shopping Routes] Get family lists request received');
  return await ShoppingListController.getFamilyLists(c);
});

export default router;
