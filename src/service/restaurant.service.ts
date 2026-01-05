import { restaurantMongoDao } from "../dao/mongodb/restaurant.dao.js";
import { RestaurantDao, RestaurantDB, CreateRestaurantResponse } from "../types/restaurant.js";
import { CreateRestaurantDto } from "../dto/restaurant.dto.js";
import { TableModel } from "../dao/mongodb/models/table.model.js";
import config from "../config/config.js";
import stripe from "../config/stripe.js";
import cache from "../utils/cache.js";
import { CACHE_TTL, CACHE_KEYS } from "../constants/business.js";

export default class RestaurantService {
    private dao: RestaurantDao;

    constructor(dao: RestaurantDao) {
        this.dao = dao;
    }

    private createTables = async (restaurantId: string, numberTables: number): Promise<void> => {
        const tables = [];
        for (let i = 1; i <= numberTables; i++) {
            tables.push({
                restaurant: restaurantId,
                tableNumber: i,
            });
        }
        await TableModel.insertMany(tables);
    };

    create = async (body: CreateRestaurantDto): Promise<CreateRestaurantResponse> => {
        try {
            // 1️⃣ Crear la cuenta conectada de Stripe
            const account = await stripe.accounts.create({
                type: "express",
                country: "US", // o el país donde operan
                ...(body.email ? { email: body.email } : {}),// opcional
                business_type: "company",
                capabilities: {
                    transfers: { requested: true },
                    card_payments: { requested: true },
                },
            });

            // 2️⃣ Crear el restaurante en MongoDB (agregando el account.id de Stripe)
            const restaurantData = { ...body, stripeAccountId: account.id };
            const restaurant = await this.dao.create(restaurantData);

            // 3️⃣ Crear el enlace de onboarding de Stripe
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${config.FRONT_ENDPOINT}/onboarding/refresh`,
                return_url: `${config.FRONT_ENDPOINT}/dashboard`,
                type: "account_onboarding",
            });

            // 4️⃣ Crear las mesas del restaurante
            await this.createTables(restaurant._id.toString(), body.numberTables);

            // 5️⃣ Invalidar caché
            await cache.del(CACHE_KEYS.restaurants());

            // 6️⃣ Devolver el restaurante creado y el enlace de onboarding
            return { _id: restaurant._id, restaurant, onboardingUrl: accountLink.url };

        } catch (error: any) {
            console.error("❌ Error creando restaurante con Stripe:", error);
            throw new Error(error.message || "Error al crear el restaurante");
        };
    };

    getAll = async (): Promise<RestaurantDB[]> => {
        const cacheKey = CACHE_KEYS.restaurants();
        const cached = await cache.get<RestaurantDB[]>(cacheKey);
        if (cached) return cached;

        const restaurants = await this.dao.getAll();
        await cache.set(cacheKey, restaurants, CACHE_TTL.RESTAURANT);
        return restaurants;
    };

    getById = async (id: string): Promise<RestaurantDB | null> => {
        const cacheKey = CACHE_KEYS.restaurant(id);
        const cached = await cache.get<RestaurantDB>(cacheKey);
        if (cached) return cached;

        const restaurant = await this.dao.getById(id);
        if (restaurant) await cache.set(cacheKey, restaurant, CACHE_TTL.RESTAURANT);
        return restaurant;
    };

    update = async (id: string, body: Partial<RestaurantDB>): Promise<RestaurantDB | null> => {
        const result = await this.dao.update(id, body);
        await cache.del(CACHE_KEYS.restaurant(id));
        await cache.del(CACHE_KEYS.restaurants());
        return result;
    };

    delete = async (id: string): Promise<RestaurantDB | null> => {
        const result = await this.dao.delete(id);
        await cache.del(CACHE_KEYS.restaurant(id));
        await cache.del(CACHE_KEYS.restaurants());
        return result;
    };

}

export const restaurnatService = new RestaurantService(restaurantMongoDao);