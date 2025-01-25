import { ShoppingItemController } from './item-controller';
import { ShoppingListController } from './list-controller';

export { ShoppingItemController, ShoppingListController };

export default {
  createItem: ShoppingItemController.createItem,
  updateItem: ShoppingItemController.updateItem,
  deleteItem: ShoppingItemController.deleteItem,
  getItems: ShoppingItemController.getItems,
  getListNames: ShoppingListController.getListNames
};