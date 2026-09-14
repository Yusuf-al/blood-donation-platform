import { Router } from "express";

import { userController } from "./users.controller";

import { UserRole } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/auth";

const userRoutes = Router();

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        id: string;
        role: UserRole;
      };
    }
  }
}

userRoutes.get(
  "/all-users",
  auth([UserRole.ADMIN]),
  userController.getAllUserFromDB,
);

userRoutes.post("/register", userController.createUserIntoDB);
// userRoutes.get("/:id", userController.getProfile);
userRoutes.get(
  "/me",
  auth([UserRole.ADMIN, UserRole.REQUESTER, UserRole.DONOR]),
  userController.getMyProfile,
);

userRoutes.put(
  "/my-profile",
  auth([UserRole.ADMIN, UserRole.REQUESTER, UserRole.DONOR]),
  userController.updateMyProfile,
);

export default userRoutes;
