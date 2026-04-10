import { RestaurantModel } from "./models/restaurant.model.js";
import { RestaurantDB } from "../../types/restaurant.types.js";
import { CreateRestaurantDto } from "../../dto/restaurant.dto.js";
import { Model } from "mongoose";
import MongoDao from "./mongo.dao.js";

class RestaurantMongoDao extends MongoDao<RestaurantDB, CreateRestaurantDto> {
    constructor(model: Model<RestaurantDB>) {
        super(model);
    }

    async findByLocation({ lng, lat, radiusMeters }: any) {
        return await RestaurantModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat] // [Longitud, Latitud] - Regla de Oro en Mongo
                    },
                    $maxDistance: radiusMeters
                }
            }
        })
            .lean();
    }
}

export const restaurantMongoDao = new RestaurantMongoDao(RestaurantModel);