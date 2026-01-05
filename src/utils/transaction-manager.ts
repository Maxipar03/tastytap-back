import { ClientSession, startSession } from "mongoose";

export async function withTransaction<T>(
    operation: (session: ClientSession) => Promise<T>
): Promise<T> {
    const session = await startSession();
    session.startTransaction();
    try {
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}