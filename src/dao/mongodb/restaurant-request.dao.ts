
import MongoDao from "./mongo.dao.js";
import { Model } from "mongoose";
import { RestaurantRequestModel } from "./models/restaurant-request.model.js";
import { RestaurantRequestDB } from "../../types/restaurant-request.js";
import { RestaurantRequestDto } from "../../dto/restaurant-request.dto.js";

class RestaurantRequestMongoDao extends MongoDao<RestaurantRequestDB, RestaurantRequestDto> {
    constructor(model: Model<RestaurantRequestDB>) {
        super(model);
    }
}

export const restaurantRequestMongoDao = new RestaurantRequestMongoDao(RestaurantRequestModel)