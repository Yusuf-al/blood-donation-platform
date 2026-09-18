import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { donorServices } from "./donors.service";
import AppError from "../../errors/AppError";
import { IDonorProfile } from "./donors.interface";

const createADonor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id;
    if (!req.user?.id) {
      throw AppError.unauthorized("user not found");
    }
    const result = await donorServices.createDonor(
      req.body as IDonorProfile,
      id as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "New Donor Profile created successfully",
      data: result,
    });
  },
);

const donorProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const result = await donorServices.donorProfile(id as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Donor Profile retrived successfully",
      data: result,
    });
  },
);

const donorProfileApplication = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const result = await donorServices.approvedDonorApplication(id as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Donor Application Approved",
      data: result,
    });
  },
);

export const donorController = {
  createADonor,
  donorProfile,
  donorProfileApplication,
};
