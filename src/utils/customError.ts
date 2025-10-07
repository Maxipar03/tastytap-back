// customError.ts

export class CustomError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = "CustomError"
    }
}

export class BadRequestError extends CustomError {
    constructor(message: string) {
        super(message, 400); // 404 Bad Request
        this.name = "BadRequestError";
    }
}

export class NotFoundError extends CustomError {
    constructor(message: string) {
        super(message, 404); // 404 Not Found
        this.name = "NotFoundError";
    }
}

export class UnauthorizedError extends CustomError {
    constructor(message: string) {
        super(message, 401); // 401 Unauthorized
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends CustomError {
    constructor(message: string) {
        super(message, 403); // 403 forbidden
        this.name = "ForbiddenError";
    }
}

export class OrderReadyError extends CustomError {
    constructor(message: string = "No se pueden agregar items a una orden que ya está lista") {
        super(message, 409); // 409 Conflict
        this.name = "OrderReadyError";
    }
}