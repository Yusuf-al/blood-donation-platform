import { Router } from "express";
import { bloodReqController } from "./br.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { bloodRequestSchema } from "./br.validation";

const bloodReqRoutes = Router();

bloodReqRoutes.post(
  "/new-request",
  auth([UserRole.ADMIN, UserRole.REQUESTER, UserRole.DONOR]),
  validateRequest(bloodRequestSchema),
  bloodReqController.createNewBloodRequest,
);

bloodReqRoutes.patch(
  "/update-request/:id",
  auth([UserRole.ADMIN, UserRole.REQUESTER]),
  bloodReqController.updateRequestStatus,
);

bloodReqRoutes.get(
  "/view-request/:id",
  bloodReqController.viewBloodRequestDetails,
);

export default bloodReqRoutes;
