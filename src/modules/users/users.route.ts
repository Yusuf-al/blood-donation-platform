import { Router } from "express";

import { userController } from "./users.controller";

import { UserRole } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidation } from "./user.validation";
import { upload } from "../../lib/multer";

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

userRoutes.post(
  "/register",
  validateRequest(UserValidation.userRegistrationZodSchema),
  upload.single("profileImage"),
  userController.createUserIntoDB,
);

userRoutes.post("/verify-email", userController.verifyEmailByOTP);

userRoutes.get(
  "/me",
  auth([UserRole.ADMIN, UserRole.REQUESTER, UserRole.DONOR]),
  userController.getMyProfile,
);

userRoutes.put(
  "/update-profile",
  validateRequest(UserValidation.userUpdateZodSchema),
  auth([UserRole.ADMIN, UserRole.REQUESTER, UserRole.DONOR]),
  upload.single("profileImage"),
  userController.updateMyProfile,
);

export default userRoutes;
