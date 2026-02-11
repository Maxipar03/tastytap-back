import { Types } from "mongoose";
import { restaurantRequestMongoDao } from "../dao/mongodb/restaurant-request.dao.js";
import { RestaurantRequestDao, RestaurantRequestDB } from "../types/restaurant-request.js";
import { BadRequestError } from "../utils/custom-error.js";

export default class RestaurantRequestServices {
    private dao: RestaurantRequestDao;

    constructor(dao: RestaurantRequestDao) {
        this.dao = dao;
    }

    createRestaurantRequest = async (id: Types.ObjectId, body: any): Promise<RestaurantRequestDB> => {
        return await this.dao.create({ ...body, user: id, statusRequest: "PENDING" });
    };

    approveRequest = async (id: string): Promise<RestaurantRequestDB | null> => {
        const data = await this.dao.update(id, { statusRequest: "APPROVED" });
        if (!data) throw new BadRequestError("No se aprovar el restaurante")
        await this.dao.create({name: data?.restaurantName, numberTables: data?.estimatedTables, address: data?.address, user: data?.user});
        return data;
    };

    rejectRequest = async (id: string): Promise<RestaurantRequestDB | null> => {
        return await this.dao.update(id, { statusRequest: "REJECTED" });
    };

}

export const restaurantRequestServices = new RestaurantRequestServices(restaurantRequestMongoDao);
