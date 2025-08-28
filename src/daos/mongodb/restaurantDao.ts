import { RestaurantModel } from "./models/restaurantModel.js";
import { RestaurantDB } from "../../types/restaurant.js";
import { CreateRestaurantDto } from "../../DTO/restaurantDto.js";
import { Model, Types } from "mongoose";
import MongoDao from "./mongoDao.js";
import { FoodDB } from "../../types/food.js";

interface IMenuFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    itemName?: string;
    available?: boolean;
    search?: string;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
}

class RestaurantMongoDao extends MongoDao<RestaurantDB, CreateRestaurantDto> {
    constructor(model: Model<RestaurantDB>) {
        super(model);
    }
}

export const restaurantMongoDao = new RestaurantMongoDao(RestaurantModel);