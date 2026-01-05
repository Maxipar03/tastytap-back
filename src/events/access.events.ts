import { EventEmitter } from "events";
import { Types } from "mongoose";

interface QRUsedPayload {
    restaurant: string | Types.ObjectId;
}

class AccessEventEmitter extends EventEmitter {
    emitQRUsed(payload: QRUsedPayload) {
        this.emit("qr:used", payload);
    }
}

export const accessEvents = new AccessEventEmitter();
