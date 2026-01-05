import { EventEmitter } from "events";
import { TableDB } from "../types/table.js";
import { Types } from "mongoose";

interface TableUpdatedPayload {
    table: TableDB;
    restaurant: string | Types.ObjectId;
}

class TableEventEmitter extends EventEmitter {
    emitTableUpdated(payload: TableUpdatedPayload) {
        this.emit("table:updated", payload);
    }
}

export const tableEvents = new TableEventEmitter();
