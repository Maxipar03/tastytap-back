import { Model } from "mongoose";
import { Types } from "mongoose";

export default class MongoDao <T, C> {

    protected model: Model<T>

    constructor(model : Model<T>) {
        this.model = model;
    }

    getAll = async (): Promise<T[]> => {
        try {
            return (await this.model.find().lean()) as T[];
        } catch (error) {
            throw error
        }
    };

    getById = async (id: string | Types.ObjectId): Promise<T | null> => {
        try {
            return (await this.model.findById(id).lean()) as T | null;
        } catch (error) {
            throw error
        }
    };

    create = async (body: C): Promise<T> => {
        try {
            return (await this.model.create(body)) as T;
        } catch (error) {
            console.error("Error en create():", error);
            throw error
        }
    };

    update = async (id: string | Types.ObjectId, body: Partial<T>): Promise<T | null> => {
        try {
            return (await this.model.findByIdAndUpdate(id, body, { new: true }).lean()) as T | null;
        } catch (error) {
            throw error
        }
    };

    delete = async (id: string | Types.ObjectId): Promise<T | null> => {
        try {
            return (await this.model.findByIdAndDelete(id).lean()) as T | null;
        } catch (error) {
            throw error
        }
    };
}