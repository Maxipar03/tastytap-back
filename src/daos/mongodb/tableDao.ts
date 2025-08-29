import { TableModel } from "./models/tableModel.js";
import MongoDao from "./mongoDao.js";
import { Model, Types } from "mongoose";
import { TableDB } from "../../types/table.js";
import { BadRequestError } from "../../utils/customError.js";
import { CreateTableDto } from "../../DTO/tableDto.js";

class TableMongoDao extends MongoDao <TableDB, CreateTableDto>{
    constructor(model: Model<TableDB>) {
        super(model);
    }

    getByRestaurant = async (restaurant: string | Types.ObjectId): Promise <TableDB[]> => {
        try {
            if (!Types.ObjectId.isValid(restaurant)) throw new BadRequestError("ID inválido");
            const tables = await this.model.find({ restaurant: restaurant }).populate("restaurant").populate("waiterServing").lean<TableDB[]>();
            return tables
        } catch (error) {
            console.error(`Error in getByRestaurant for restaurant ${restaurant}:`, error);
            throw error;
        }
    }
    
    update = async (id: string | Types.ObjectId, updateData: Partial<TableDB>): Promise<TableDB | null> => {
        try {
            if (!Types.ObjectId.isValid(id)) throw new BadRequestError("ID inválido");
            const updatedTable = await this.model.findByIdAndUpdate(id, updateData, { new: true }).lean<TableDB>();
            return updatedTable 
        } catch (error) {
            console.error(`Error in update for tableId ${id}:`, error);
            throw error;
        }
    }
}

export const tableMongoDao = new TableMongoDao(TableModel)