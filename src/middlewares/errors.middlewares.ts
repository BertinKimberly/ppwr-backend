import { Request, ErrorRequestHandler, Response, NextFunction } from "express";

import { prod } from "../constants";
import { GeneralResponse } from "./generalResponse";

export class AppError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.message = message;
    this.stack = prod ? "" : this.stack;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof AppError) {
    const code = error.code || 500;
    const message = error.message || "Internal Server Error";
    const response = new GeneralResponse(false, message);

    res.status(code).json(response);
  } else {
    res.status(500).json({
      message: "Something went wrong",
      code: 500,
      success: false,
      data: null,
    });
  }

  next();
};

export const handleCatchError = (error: AppError | any, res: Response): Response => {
  if (error instanceof AppError) {
      console.log(error);
      return res.status(error.code).json({ error: { msg: error.message, code: error.code } });
  }
  return res.status(500).json({ error: error.message });
};