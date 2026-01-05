import { Response } from "express";

export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    NOT_FOUND = 404,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    INTERNAL_SERVER_ERROR = 500
}

export class HttpResponse {
    Ok(res: Response, data?: any): Response {
        return res.status(HttpStatus.OK).json({
            status: HttpStatus.OK, // STATUS 200
            statusMsg: "Success",
            data,
        });
    }

    Created(res: Response, data?: any): Response {
        return res.status(HttpStatus.CREATED).json({
            status: HttpStatus.CREATED, // STATUS 201
            statusMsg: "Created",
            data,
        });
    }

    NoContent(res: Response): Response {
        return res.status(HttpStatus.NO_CONTENT).json({
            status: HttpStatus.NO_CONTENT, // STATUS 204
            statusMsg: "No content"
        });
    }

    BadRequest(res: Response, data?: string): Response {
        return res.status(HttpStatus.BAD_REQUEST).json({
            status: HttpStatus.BAD_REQUEST, // STATUS 400
            statusMsg: "Bad Request",
            error: data,
        });
    }

    Unauthorized(res: Response, data?: string): Response {
        return res.status(HttpStatus.UNAUTHORIZED).json({
            status: HttpStatus.UNAUTHORIZED, // STATUS 401
            statusMsg: "Unauthorized",
            error: data,
        });
    }

    NotFound(res: Response, data?: string): Response {
        return res.status(HttpStatus.NOT_FOUND).json({
            status: HttpStatus.NOT_FOUND, // STATUS 404
            statusMsg: "Not Found",
            error: data,
        });
    }

    Forbidden(res: Response, data?: string): Response {
        return res.status(HttpStatus.FORBIDDEN).json({
            status: HttpStatus.FORBIDDEN, // STATUS 403
            statusMsg: "Forbidden",
            error: data,
        });
    }

    ServerError(res: Response, error?: Error, url?: string): Response {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            status: HttpStatus.INTERNAL_SERVER_ERROR, // STATUS 500
            statusMsg: error?.message,
            error: error?.name,
            path: url,
        });
    }

}

export const httpResponse = new HttpResponse();