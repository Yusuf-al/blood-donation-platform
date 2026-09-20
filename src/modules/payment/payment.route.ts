import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";

const paymentRoute = Router();

paymentRoute.post(
  "/create-checkout-session",
  auth([UserRole.DONOR, UserRole.REQUESTER]),
  paymentController.createPaymentSession,
);

paymentRoute.post("/webhook", paymentController.handleWebhook);
paymentRoute.post(
  "/bkash-payment",
  auth([UserRole.REQUESTER, UserRole.DONOR]),
  paymentController.bkashPaymentController,
);
paymentRoute.get("/bkash/callback", paymentController.bkashPaymentCallBack);

export default paymentRoute;
