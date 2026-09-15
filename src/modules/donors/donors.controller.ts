import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { donorServices } from "./donors.service";
import AppError from "../../errors/AppError";

const createADonor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id;
    if (!req.user?.id) {
      throw AppError.unauthorized("user not found");
    }
    const result = await donorServices.createDonor(req.body, id as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "New Donor Profile created successfully",
      data: result,
    });
  },
);

export const donorController = {
  createADonor,
};
