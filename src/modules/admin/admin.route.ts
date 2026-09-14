import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { adminController } from "./admin.controller";

const adminRoute = Router();

adminRoute.get(
  "/users",
  auth([UserRole.ADMIN]),
  adminController.allUsersFromDB,
);

adminRoute.patch(
  "/update/status/:id",
  auth([UserRole.ADMIN]),
  adminController.updateUserStatusIntoDB,
);
adminRoute.patch(
  "/update/role/:id",
  auth([UserRole.ADMIN]),
  adminController.updateUserRoleIntoDB,
);

export default adminRoute;
