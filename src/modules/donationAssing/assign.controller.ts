import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { donationAssignmentService } from "./assign.service";
import AppError from "../../errors/AppError";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const assingDonor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized("Request not found");
    }

    const result = await donationAssignmentService.createDonationAssignment(
      req.body,
      userId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Donor Assign to the request",
      data: result,
    });
  },
);

const viewDonationAssignment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const assignmentId = req.params.id;
    if (!assignmentId) {
      throw AppError.unauthorized("User not found");
    }

    const result = await donationAssignmentService.viewAssignemt(
      assignmentId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Donation Data Retrived successfully",
      data: result,
    });
  },
);

export const assignmentController = {
  assingDonor,
  viewDonationAssignment,
};
