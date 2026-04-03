import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

export const passportCall = (strategy: string, options: passport.AuthenticateOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate(strategy, options, (error: any, user: any, info: any) => {
            if (error) return next(error);
            if (!user) {
                return res.status(401).send({
                    status: 'error',
                    error: info?.messages ? info.messages : info?.toString()
                });
            }
            req.user = user;
            next();
        })(req, res, next);
    };
};