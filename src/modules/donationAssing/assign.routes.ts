import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { assignmentValidation } from "./assign.validation";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { assignmentController } from "./assign.controller";

const donationAssingRoutes = Router();

donationAssingRoutes.post(
  "/new-assignment",
  //   validateRequest(assignmentValidation.createAssignmentSchema),
  auth([UserRole.ADMIN, UserRole.DONOR]),
  assignmentController.assingDonor,
);

donationAssingRoutes.get(
  "/view-assignment/:id",
  auth([UserRole.ADMIN, UserRole.DONOR, UserRole.DONOR]),
  assignmentController.viewDonationAssignment,
);

export default donationAssingRoutes;
