import { RestaurantModel } from "./models/restaurant.model.js";
import { RestaurantDB } from "../../types/restaurant.js";
import { CreateRestaurantDto } from "../../dto/restaurant.dto.js";
import { Model } from "mongoose";
import MongoDao from "./mongo.dao.js";

class RestaurantMongoDao extends MongoDao<RestaurantDB, CreateRestaurantDto> {
    constructor(model: Model<RestaurantDB>) {
        super(model);
    }
}

export const restaurantMongoDao = new RestaurantMongoDao(RestaurantModel);