import { NextFunction, Request, Response } from "express";
import { CheckAuth } from "./auth.middleware.js";

/**
 * Middleware to check if the user is Admin or SuperAdmin.
 */
export const CheckAdmin = (req: Request, res: Response, next: NextFunction) => {
   CheckAuth(req, res, next, ["ADMIN"]);
};
