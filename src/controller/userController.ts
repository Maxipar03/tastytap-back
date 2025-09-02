import { userService } from "../services/userService.js";
import generateToken from "../utils/generateToken.js";
import { UserService } from "../types/user.js";
import { UserPayload } from "../types/express.js";
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/customError.js";
import { JwtPayload } from "jsonwebtoken";
import { httpResponse } from "../utils/http-response.js";

class UserController {

    private service: UserService;

    constructor(services: UserService) {
        this.service = services;
    }

    googleResponse = async (req: Request, res: Response, next: NextFunction) => {
        try {

            if (!req.user) throw new BadRequestError("No se encontro el usuario")

            const userPayload: UserPayload & JwtPayload = {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                restaurant: req.user.restaurant
            };

            const token = generateToken(userPayload);

            res.cookie('user_info', token,{
                httpOnly: true,
                secure: true,    
                sameSite: 'none',
            });

            return httpResponse.Created(res, { user: req.user })
        } catch (error) {
            next(error);
        }
    }

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const response = await this.service.register(req.body);
            const tokenTable = req.cookies.access_token

            if (tokenTable) return httpResponse.Created(res, { response, redirect: "/seats" })
            return httpResponse.Created(res, { response, redirect: "/" })
        } catch (error) {
            next(error);
        }
    }

    logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.clearCookie('user_info',{
                httpOnly: true,
                secure: true,    
                sameSite: 'none',
            });

            return httpResponse.Ok(res, "Sesion cerrada correctamente");
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const user = await this.service.login(email, password);

            const userPayload: UserPayload & JwtPayload = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurant: user.restaurant!
            };

            const token = generateToken(userPayload);

            res.cookie('user_info', token, {
                httpOnly: true,
                secure: true,    
                sameSite: 'none',
            });

            const tokenTable = req.cookies.access_token

            if (tokenTable) return httpResponse.Ok(res, { userPayload, redirect: "/seats" })
            return httpResponse.Ok(res, { userPayload, redirect: "/" })
        } catch (error) {
            next(error);
        }
    }

    getUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            return httpResponse.Ok(res, req.user)
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController(userService)