import { SeatModel } from "./models/seatModel.js";
import { SeatDB } from "../../types/seat.js";
import { Model, Types } from "mongoose";
import MongoDao from "./mongoDao.js";
import { BadRequestError } from "../../utils/customError.js";
import { CreateSeatDto } from "../../DTO/createSeatDto.js";

class SeatMongoDao extends MongoDao <SeatDB, CreateSeatDto> {

    constructor(model: Model<SeatDB>) {
        super(model);
    }

    getByObjectId = async (id: Types.ObjectId | string): Promise<SeatDB | null> => {
        try {
            if (!Types.ObjectId.isValid(id)) throw new BadRequestError("ID inválido");
            return (await this.model.findById(id).lean()) as SeatDB | null;
        } catch (error) {
            throw error;
        }
    }

    getByTableId = async (tableId: string | Types.ObjectId, onlyActive: boolean = false): Promise<SeatDB[]> => {
        try {
            if (!Types.ObjectId.isValid(tableId)) throw new BadRequestError("ID inválido");
            const query: {tableId: string | Types.ObjectId  , isActive?: boolean} = { tableId: tableId };
            if (onlyActive) {
                query.isActive = true;
            }
            return (await this.model.find(query).lean()) as SeatDB[];
        } catch (error) {
            throw error;
        }
    }
    
    findOne = async (filter: object): Promise<SeatDB | null> => {
        try{
            return (await this.model.findOne(filter).lean()) as SeatDB | null;
        }catch(error){
            throw error;
        }
    }
}

export const seatMogoDao = new SeatMongoDao(SeatModel)