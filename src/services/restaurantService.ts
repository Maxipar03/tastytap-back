import {CustomError, NotFoundError} from "../utils/customError.js";
import { restaurantMongoDao } from "../daos/mongodb/restaurantDao.js";
import { RestaurantDao, RestaurantDB } from "../types/restaurant.js";
import { CreateRestaurantDto } from "../DTO/restaurantDto.js";

export default class RestaurantService {
    private dao: RestaurantDao;

    constructor (dao: RestaurantDao) {
        this.dao = dao;
    }

    create = async (body: CreateRestaurantDto): Promise<RestaurantDB> => {
        try{
            const response = await this.dao.create(body);
            if(!response) throw new CustomError("Error al crear el restaurante", 500);
            return response;
        }catch (error) {
            throw error;
        };
    };

    getAll = async (): Promise<RestaurantDB[]> => {
        try{
            return await this.dao.getAll();
        }catch (error) {
            throw error;
        }
    };

    getById = async (id: string): Promise <RestaurantDB | null> => {
        try{
            const response = await this.dao.getById(id);
            if(!response) throw new NotFoundError("No se encontro el restaurante");
            return response;
        }catch (error) {
            throw error;
        }
    };

    update = async (id: string, body: Partial<RestaurantDB>): Promise<RestaurantDB | null> => {
        try{
            const response = await this.dao.update(id, body);
            if(!response) throw new NotFoundError("No se encontro el restaurante");
            return response;
        }catch (error) {
            throw error;
        }
    };
    
    delete = async (id: string): Promise<RestaurantDB | null> => {
        try{
            const response = await this.dao.delete(id);
            if(!response) throw new NotFoundError("No se encontro el restaurante");
            return response;
        }catch (error) {
            throw error;
        }
    };

}

export const restaurnatService = new RestaurantService(restaurantMongoDao);