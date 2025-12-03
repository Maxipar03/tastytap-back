// helpers/orderHelpers.ts
import { Types } from "mongoose";
import { NotFoundError } from "../utils/customError.js";

export const prepareOrderData = ({
    body,
    tableData,
    user,
    toGoData,
}: {
    body: any;
    tableData?: any;
    user?: any;
    toGoData?: any;
}) => {
    
    if (toGoData) {
        return {
            items: body.items,
            pricing: body.pricing,
            status: body.status,
            orderType: "togo" as const,
            restaurant: toGoData.restaurant.id,
            userName: user ? user.name : body.guestName,
            clientId: user ? new Types.ObjectId(user.id) : undefined,
        };
    }

    if (!tableData) throw new NotFoundError("Datos de mesa no encontrados");

    return {
        items: body.items,
        pricing: body.pricing,
        status: body.status,
        orderType: "dine-in" as const,
        tableId: tableData.tableId,
        waiterId: tableData.waiterId,
        restaurant: tableData.restaurant.id,
        userName: user ? user.name : body.guestName,
        clientId: user ? new Types.ObjectId(user.id) : undefined,
    };
};