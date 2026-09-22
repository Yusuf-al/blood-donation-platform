import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { adminController } from "./admin.controller";
import { donorController } from "../donors/donors.controller";

const adminRoute = Router();

adminRoute.get(
  "/users",
  auth([UserRole.ADMIN]),
  adminController.allUsersFromDB,
);

adminRoute.get(
  "/donors",
  auth([UserRole.ADMIN]),
  adminController.donorProfilesFromDB,
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

adminRoute.patch(
  "/delete/user/:id",
  auth([UserRole.ADMIN]),
  adminController.deleteUserFromDB,
);

adminRoute.put(
  "/profile-approve/:id",
  auth([UserRole.ADMIN]),
  donorController.donorProfileApplication,
);

export default adminRoute;
