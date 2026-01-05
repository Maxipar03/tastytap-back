import { TableModel } from "./models/table.model.js";
import MongoDao from "./mongo.dao.js";
import { Model, Types } from "mongoose";
import { TableDB } from "../../types/table.js";
import { BadRequestError } from "../../utils/custom-error.js";
import { CreateTableDto } from "../../dto/table.dto.js";

class TableMongoDao extends MongoDao <TableDB, CreateTableDto>{
    constructor(model: Model<TableDB>) {
        super(model);
    }

    getByRestaurant = async (restaurant: string | Types.ObjectId): Promise <TableDB[]> => {
        try {
            const tables = await this.model.find({ restaurant: restaurant }).populate("restaurant").populate("waiterServing").lean<TableDB[]>();
            return tables
        } catch (error) {
            console.error(`Error in getByRestaurant for restaurant ${restaurant}:`, error);
            throw error;
        }
    }

    getById = async (id: string | Types.ObjectId): Promise<TableDB | null> => {
        try {
            return await this.model.findById(id).lean<TableDB>();
        } catch (error) {
            console.error(`Error in getById for tableId ${id}:`, error);
            throw error;
        }
    }
    
    update = async (id: string | Types.ObjectId, updateData: Partial<TableDB>): Promise<TableDB | null> => {
        try {
            const updatedTable = await this.model.findByIdAndUpdate(id, updateData, { new: true }).populate("waiterServing").lean<TableDB>();
            return updatedTable 
        } catch (error) {
            console.error(`Error in update for tableId ${id}:`, error);
            throw error;
        }
    }
}

export const tableMongoDao = new TableMongoDao(TableModel)