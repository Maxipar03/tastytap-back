import { RestaurantModel } from "./models/restaurant.model.js";
import { RestaurantDB } from "../../types/restaurant.types.js";
import { CreateRestaurantDto } from "../../dto/restaurant.dto.js";
import { Model } from "mongoose";
import MongoDao from "./mongo.dao.js";

class RestaurantMongoDao extends MongoDao<RestaurantDB, CreateRestaurantDto> {
    constructor(model: Model<RestaurantDB>) {
        super(model);
    }

    async findByLocation({ lng, lat, radiusMeters, name }: any) {
        const pipeline: any[] = [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [lng, lat] },
                    distanceField: "distance",
                    maxDistance: radiusMeters,
                    spherical: true,
                    distanceMultiplier: 0.001
                }
            }
        ];

    
        if (name) {
            pipeline.push({
                $match: {
                    name: { $regex: name, $options: "i" }
                }
            });
        }

        return await RestaurantModel.aggregate(pipeline);
    }
}

export const restaurantMongoDao = new RestaurantMongoDao(RestaurantModel);