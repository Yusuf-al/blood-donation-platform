import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { sendRespone } from "../utils/sendResponse";
import { UserStatus, UserRole } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import AppError from "../errors/AppError";

export const auth = (roles: UserRole[] = []) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    if (!accessToken) {
      throw AppError.unauthorized(
        "You are not logged in. Please login to access.",
      );
    }

    const { success, token } = jwtUtils.verifyToken(
      accessToken,
      config.jwt_access_secret,
    );
    if (!success || !token) {
      throw AppError.unauthorized(
        "Invalid or expired access token. Please login again.",
      );
    }

    const { email, role, id } = token;

    const user = await prisma.user.findUnique({
      where: {
        email,
        id,
        role,
      },
    });

    if (!user) {
      throw AppError.unauthorized("User not found. Please login again.");
    }

    if (user.isActive === UserStatus.BLOCKED) {
      throw AppError.forbidden(
        "Your account has been blocked. Please contact support.",
      );
    }

    if (roles.length && !roles.includes(user.role)) {
      throw AppError.forbidden("Access forbidden: insufficient permissions.");
    }

    req.user = {
      email,
      role,
      id,
    };

    next();
  });
};
