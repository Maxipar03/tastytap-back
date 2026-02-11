import { restaurantMongoDao } from "../dao/mongodb/restaurant.dao.js";
import { RestaurantDao, RestaurantDB, CreateRestaurantResponse } from "../types/restaurant.js";
import { CreateRestaurantDto } from "../dto/restaurant.dto.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { TableModel } from "../dao/mongodb/models/table.model.js";
import config from "../config/config.js";
import stripe from "../config/stripe.js";
import cache from "../utils/cache.js";
import { CACHE_TTL, CACHE_KEYS } from "../constants/business.js";
import { userMongoDao } from "../dao/mongodb/user.dao.js";
import { Types } from "mongoose";

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

    create = async (body: CreateRestaurantDto, userId: Types.ObjectId): Promise<CreateRestaurantResponse> => {
        try {
            const account = await stripe.accounts.create({
                type: "express",
                country: "US",
                business_type: "company",
                capabilities: {
                    transfers: { requested: true },
                    card_payments: { requested: true },
                },
            });

            const restaurantData = { 
                ...body,
                stripeAccountId: account.id 
            };
            const restaurant = await this.dao.create(restaurantData);

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${config.FRONT_ENDPOINT}/onboarding/refresh`,
                return_url: `${config.FRONT_ENDPOINT}/dashboard`,
                type: "account_onboarding",
            });
            
            await this.createTables(restaurant._id.toString(), body.numberTables);
            await userMongoDao.update(userId.toString(), {role: "owner", restaurant: restaurant._id});
            await cache.del(CACHE_KEYS.restaurants());

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

    update = async (id: string, body: Partial<RestaurantDB & { file?: Express.Multer.File }>): Promise<RestaurantDB | null> => {
        let imageUrl: string | undefined;
        if (body.file) imageUrl = await uploadToCloudinary(body.file);

        const updateData = {
            ...body,
            ...(imageUrl && { logo: imageUrl })
        };

        const result = await this.dao.update(id, updateData);
        await cache.del(CACHE_KEYS.restaurant(id));
        await cache.del(CACHE_KEYS.restaurants());
        return result;
    };

    updateByStripeAccountId = async (stripeAccountId: string, data: Partial<RestaurantDB>): Promise<RestaurantDB | null> => {
        const restaurant = await this.dao.getByFilter({ stripeAccountId });
        if (!restaurant) return null;
        
        const result = await this.dao.update(restaurant._id.toString(), data);
        await cache.del(CACHE_KEYS.restaurant(restaurant._id.toString()));
        await cache.del(CACHE_KEYS.restaurants());
        return result;
    };

    createOnboarding = async (restaurantId: string): Promise<{ url: string }> => {
        const restaurant = await this.dao.getById(restaurantId);
        if (!restaurant?.stripeAccountId) throw new Error("Cuenta de Stripe no encontrada");

        const accountLink = await stripe.accountLinks.create({
            account: restaurant.stripeAccountId,
            refresh_url: `${config.FRONT_ENDPOINT}/onboarding/refresh`,
            return_url: `${config.FRONT_ENDPOINT}/dashboard`,
            type: "account_onboarding",
        });

        return { url: accountLink.url };
    };

}

export const restaurnatService = new RestaurantService(restaurantMongoDao);