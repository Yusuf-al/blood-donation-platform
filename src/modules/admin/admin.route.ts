import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { propertiesController } from "../properties/properties.controller";
import { adminController } from "./admin.controller";
import { rentalController } from "../rentalRequest/rent.controller";

const adminRoute = Router();

adminRoute.get(
  "/properties",
  auth([UserRole.ADMIN]),
  propertiesController.getAllPropertiesFromDB,
);

adminRoute.get(
  "/users",
  auth([UserRole.ADMIN]),
  adminController.allUsersFromDB,
);

adminRoute.get(
  "/rental-requests",
  auth([UserRole.ADMIN]),
  rentalController.getAllRentalRequest,
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
