import { BasePlugin } from '../../sdk/core/BasePlugin';
import { PluginConfig, PluginHealthCheck } from '../../sdk/core/types';
import { Event } from '../../sdk/events/types';
import { z } from 'zod';
import { prisma } from './prisma/client';
import { ShoppingController } from './controllers/ShoppingController';
import { Context } from 'hono';
import { RouteDefinition } from '../../sdk/core/routes';

/**
 * Plugin configuration schema
 */
const configSchema = z.object({
  features: z.object({
    sharing: z.boolean().default(true),
    autoArchive: z.boolean().default(true),
    itemSuggestions: z.boolean().default(true)
  }),
  roles: z.object({
    canCreateLists: z.array(z.string()).default(['PARENT', 'CHILD']),
    canDeleteLists: z.array(z.string()).default(['PARENT']),
    canManageItems: z.array(z.string()).default(['PARENT', 'CHILD'])
  }),
  limits: z.object({
    maxListsPerFamily: z.number().min(1).default(50),
    maxItemsPerList: z.number().min(1).default(100),
    archiveAfterDays: z.number().min(1).default(30)
  })
});

type ShoppingPluginConfig = z.infer<typeof configSchema>;

/**
 * Shopping plugin implementation
 */
export class ShoppingPlugin extends BasePlugin {
  private shoppingController: ShoppingController;
  private metricsInterval?: NodeJS.Timeout;
  private metrics = {
    totalLists: 0,
    activeLists: 0,
    totalItems: 0,
    purchasedItems: 0
  };

  constructor() {
    const config: PluginConfig = {
      metadata: {
        name: 'shopping-plugin',
        version: '1.0.0',
        description: 'Shopping list management plugin',
        author: 'FamilyManager',
        license: 'MIT'
      },
      config: configSchema,
      events: {
        subscriptions: ['family.updated'],
        publications: [
          'shopping.list.created',
          'shopping.list.updated',
          'shopping.list.deleted',
          'shopping.item.created',
          'shopping.item.updated',
          'shopping.item.purchased',
          'shopping.item.deleted'
        ]
      }
    };

    super(config);

    // Initialize controller
    this.shoppingController = new ShoppingController(prisma);

    // Add routes
    this.config.routes = this.getRoutes();
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    this.logger.info('Initializing shopping plugin');
    await this.updateMetrics();
  }

  /**
   * Start plugin
   */
  async onStart(): Promise<void> {
    this.logger.info('Starting shopping plugin');
    this.metricsInterval = setInterval(() => this.updateMetrics(), 60000);
  }

  /**
   * Stop plugin
   */
  async onStop(): Promise<void> {
    this.logger.info('Stopping shopping plugin');
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  /**
   * Handle events
   */
  protected async handleEvent(event: Event): Promise<void> {
    switch (event.type) {
      case 'family.updated':
        await this.shoppingController.handleFamilyUpdated(event.data);
        break;
    }
  }

  /**
   * Define plugin routes
   */
  private getRoutes(): RouteDefinition[] {
    const config = this.context.config as ShoppingPluginConfig;
    const routes: RouteDefinition[] = [
      // List routes
      {
        path: '/api/shopping/lists',
        method: 'GET' as const,
        handler: this.shoppingController.getLists.bind(this.shoppingController),
        description: 'Get all shopping lists'
      },
      {
        path: '/api/shopping/lists',
        method: 'POST' as const,
        handler: async (c: Context) => {
          const user = c.get('user');
          if (!config.roles.canCreateLists.includes(user.role)) {
            return c.json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'User not authorized to create shopping lists'
              }
            }, 403);
          }
          return this.shoppingController.createList(c);
        },
        description: 'Create a new shopping list'
      },
      {
        path: '/api/shopping/lists/:id',
        method: 'GET' as const,
        handler: this.shoppingController.getListById.bind(this.shoppingController),
        description: 'Get a shopping list by ID'
      },
      {
        path: '/api/shopping/lists/:id',
        method: 'PUT' as const,
        handler: this.shoppingController.updateList.bind(this.shoppingController),
        description: 'Update a shopping list'
      },
      {
        path: '/api/shopping/lists/:id',
        method: 'DELETE' as const,
        handler: async (c: Context) => {
          const user = c.get('user');
          if (!config.roles.canDeleteLists.includes(user.role)) {
            return c.json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'User not authorized to delete shopping lists'
              }
            }, 403);
          }
          return this.shoppingController.deleteList(c);
        },
        description: 'Delete a shopping list'
      },

      // Item routes
      {
        path: '/api/shopping/items',
        method: 'GET' as const,
        handler: this.shoppingController.getItems.bind(this.shoppingController),
        description: 'Get all shopping items'
      },
      {
        path: '/api/shopping/items',
        method: 'POST' as const,
        handler: async (c: Context) => {
          const user = c.get('user');
          if (!config.roles.canManageItems.includes(user.role)) {
            return c.json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'User not authorized to create shopping items'
              }
            }, 403);
          }
          return this.shoppingController.createItem(c);
        },
        description: 'Create a new shopping item'
      },
      {
        path: '/api/shopping/items/:id',
        method: 'GET' as const,
        handler: this.shoppingController.getItemById.bind(this.shoppingController),
        description: 'Get a shopping item by ID'
      },
      {
        path: '/api/shopping/items/:id',
        method: 'PUT' as const,
        handler: async (c: Context) => {
          const user = c.get('user');
          if (!config.roles.canManageItems.includes(user.role)) {
            return c.json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'User not authorized to update shopping items'
              }
            }, 403);
          }
          return this.shoppingController.updateItem(c);
        },
        description: 'Update a shopping item'
      },
      {
        path: '/api/shopping/items/:id',
        method: 'DELETE' as const,
        handler: async (c: Context) => {
          const user = c.get('user');
          if (!config.roles.canManageItems.includes(user.role)) {
            return c.json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'User not authorized to delete shopping items'
              }
            }, 403);
          }
          return this.shoppingController.deleteItem(c);
        },
        description: 'Delete a shopping item'
      }
    ];

    return routes;
  }

  /**
   * Update metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      const [totalLists, activeLists, totalItems, purchasedItems] = await Promise.all([
        prisma.countLists(),
        prisma.countLists({ hasItems: true }),
        prisma.countItems(),
        prisma.countItems({ purchased: true })
      ]);

      this.metrics = {
        totalLists,
        activeLists,
        totalItems,
        purchasedItems
      };
    } catch (error) {
      this.logger.error('Error updating metrics', error as Error);
    }
  }

  /**
   * Get plugin health status
   */
  async getHealth(): Promise<PluginHealthCheck> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: Date.now(),
        message: 'Plugin is healthy',
        metrics: this.metrics
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        error,
        message: 'Database connection failed'
      };
    }
  }
}
