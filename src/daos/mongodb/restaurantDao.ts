import { RestaurantModel } from "./models/restaurantModel.js";
import { RestaurantDB } from "../../types/restaurant.js";
import { CreateRestaurantDto } from "../../DTO/restaurantDto.js";
import { Model } from "mongoose";
import MongoDao from "./mongoDao.js";

class RestaurantMongoDao extends MongoDao<RestaurantDB, CreateRestaurantDto> {
    constructor(model: Model<RestaurantDB>) {
        super(model);
    }
}

export const restaurantMongoDao = new RestaurantMongoDao(RestaurantModel);