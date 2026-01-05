import { Types } from "mongoose";

export abstract class BaseRepository<T, CreateDto> {
    constructor(protected dao: any) {}

    async create(data: CreateDto, session?: any): Promise<T> {
        return this.dao.create(data, session);
    }

    async getById(id: string | Types.ObjectId): Promise<T | null> {
        return this.dao.getById(id);
    }

    async update(id: string | Types.ObjectId, data: Partial<T>, session?: any): Promise<T | null> {
        return this.dao.update(id, data, session);
    }

    async delete(id: string | Types.ObjectId, session?: any): Promise<T | null> {
        return this.dao.delete(id, session);
    }
}
