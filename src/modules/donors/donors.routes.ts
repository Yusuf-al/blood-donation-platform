import { Router } from "express";
import { donorController } from "./donors.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";

const donorRoutes = Router();
donorRoutes.post(
  "/become-donor",
  auth([UserRole.REQUESTER]),
  donorController.createADonor,
);

donorRoutes.get(
  "/profile/:id",
  auth([UserRole.REQUESTER, UserRole.ADMIN, UserRole.DONOR]),
  donorController.donorProfile,
);

export default donorRoutes;
