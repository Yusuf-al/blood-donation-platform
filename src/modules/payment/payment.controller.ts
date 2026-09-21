import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentServices } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errors/AppError";

const createPaymentSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const result = await paymentServices.paymentSession(userId as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Payment completed successfully",
      data: result,
    });
  },
);

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const event = req.body;
  const signature = req.headers["stripe-signature"]!;

  await paymentServices.handlePaymentWebhook(
    event as Buffer,
    signature as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "webhook triggered successfully",
  });
});

const bkashPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const user_id = req.user?.id;

    if (!user_id) {
      throw AppError.badRequest("User is not logged in");
    }

    const result = await paymentServices.bkashPaymentService(user_id as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Bkash Payment created",
      data: result,
    });
  },
);

const bkashPaymentCallBack = catchAsync(async (req: Request, res: Response) => {
  const { bkashPaymentExecuteResponse, redirectUrl } =
    await paymentServices.bkashPaymentCallback(req.query);
  res.redirect(redirectUrl);
  console.log(bkashPaymentExecuteResponse);
  // sendResponse(res, {
  //   statusCode: 200,
  //   success: true,
  //   message: "Bkash Payment created",
  //   data: result,
  // });
});

export const paymentController = {
  createPaymentSession,
  handleWebhook,
  bkashPaymentController,
  bkashPaymentCallBack,
};
