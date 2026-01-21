import { Model } from "mongoose";
import { Types } from "mongoose";
import { BadRequestError } from "../../utils/custom-error";
import * as Sentry from "@sentry/node";

export default class MongoDao<T, C> {

    protected model: Model<T>

    constructor(model: Model<T>) {
        this.model = model;
    }

    getAll = async (): Promise<T[]> => {
        try {
            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Executing getAll query',
                data: { collection: this.model.collection.name }
            });
            return (await this.model.find().lean()) as T[];
        } catch (error) {
            throw error
        }
    };

    getById = async (id: string | Types.ObjectId): Promise<T | null> => {
        try {
            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Executing getById query',
                data: { collection: this.model.collection.name, id: id.toString() }
            });
            return (await this.model.findById(id).lean()) as T | null;
        } catch (error) {
            throw error
        }
    };

    create = async (body: C, session?: any): Promise<T> => {
        try {
            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Executing create operation',
                data: { collection: this.model.collection.name }
            });
            const result = session ? await this.model.create([body], { session }) : await this.model.create(body);
            return (Array.isArray(result) ? result[0] : result) as T;
        } catch (error) {
            throw error
        }
    };

    update = async (id: string | Types.ObjectId, body: Partial<T>, session?: any): Promise<T | null> => {
        try {
            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Executing update operation',
                data: { collection: this.model.collection.name, id: id.toString() }
            });
            const options = session ? { new: true, session } : { new: true };
            return (await this.model.findByIdAndUpdate(id, body, options).lean()) as T | null;
        } catch (error) {
            throw error
        }
    };

    delete = async (id: string | Types.ObjectId): Promise<T | null> => {
        try {
            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Executing delete operation',
                data: { collection: this.model.collection.name, id: id.toString() }
            });
            return (await this.model.findByIdAndDelete(id).lean()) as T | null;
        } catch (error) {
            throw error
        }
    };

    getByFilter = async (filter: Partial<T>): Promise<T | null> => {
        try {
            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Executing getByFilter query',
                data: { collection: this.model.collection.name, filter }
            });
            return (await this.model.findOne(filter as any).lean()) as T | null;
        } catch (error) {
            throw error
        }
    };
}