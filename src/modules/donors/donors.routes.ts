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

donorRoutes.get("/profile/:id", donorController.donorProfile);

export default donorRoutes;
