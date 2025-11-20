import { OrderModel } from "../daos/mongodb/models/orderModel.js";
import { FoodModel } from "../daos/mongodb/models/foodModel.js";
import { UserModel } from "../daos/mongodb/models/userModel.js";
import { TableModel } from "../daos/mongodb/models/tableModel.js";
import { TableSessionModel } from "../daos/mongodb/models/tableSessionModel.js";
import { RestaurantModel } from "../daos/mongodb/models/restaurantModel.js";
import { CategoryModel } from "../daos/mongodb/models/categoryModel.js";

export const createIndexes = async (): Promise<void> => {
    try {
        // ORDERS - Queries frecuentes por restaurant, status, fechas, waiter
        await OrderModel.collection.createIndex({ restaurant: 1, createdAt: -1 });
        await OrderModel.collection.createIndex({ restaurant: 1, status: 1 });
        await OrderModel.collection.createIndex({ restaurant: 1, waiterId: 1 });
        await OrderModel.collection.createIndex({ clientId: 1 });
        await OrderModel.collection.createIndex({ tableId: 1 });
        await OrderModel.collection.createIndex({ activeSession: 1 });
        await OrderModel.collection.createIndex({ createdAt: -1 });
        await OrderModel.collection.createIndex({ userName: 1 });
        await OrderModel.collection.createIndex({ "items.foodName": 1 });

        // FOOD - Queries por restaurant, category, filtros dietéticos
        await FoodModel.collection.createIndex({ restaurant: 1 });
        await FoodModel.collection.createIndex({ restaurant: 1, category: 1 });
        await FoodModel.collection.createIndex({ restaurant: 1, stock: 1 });
        await FoodModel.collection.createIndex({ category: 1 });
        await FoodModel.collection.createIndex({ name: "text", description: "text" });

        // USERS - Query por email (login)
        await UserModel.collection.createIndex({ email: 1 }, { unique: true });
        await UserModel.collection.createIndex({ restaurant: 1, role: 1 });

        // TABLES - Queries por restaurant
        await TableModel.collection.createIndex({ restaurant: 1 });
        await TableModel.collection.createIndex({ restaurant: 1, state: 1 });
        await TableModel.collection.createIndex({ activeSession: 1 });

        // TABLE SESSIONS - Queries por restaurant y table
        await TableSessionModel.collection.createIndex({ restaurant: 1, status: 1 });
        await TableSessionModel.collection.createIndex({ table: 1, status: 1 });

        // RESTAURANT - Email único
        await RestaurantModel.collection.createIndex({ email: 1 }, { unique: true });

        // CATEGORIES - Por restaurant
        await CategoryModel.collection.createIndex({ restaurant: 1 });

    } catch (error) {
        console.error("❌ Error creando índices:", error);
        throw error;
    }
};
