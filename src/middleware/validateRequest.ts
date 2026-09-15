import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../utils/catchAsync";
import AppError from "../errors/AppError";

export const validateRequest = (zodSchema: z.ZodObject) => {
  return catchAsync((req: Request, res: Response, next: NextFunction) => {
    const payload = req.body ?? {};

    const result = zodSchema.safeParse(payload);

    if (!result.success) {
      console.log(result.error);
      console.log(result.error.issues);

      throw new AppError(
        httpStatus.BAD_REQUEST,
        result.error.issues[0]?.message ?? "Validation failed",
      );
    }

    req.body = result.data;

    next();
  });
};
