import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { donationAssignmentService } from "./assign.service";
import AppError from "../../errors/AppError";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AssignmentStatus } from "../../../generated/prisma/client";
import { ICreateDonationRecordInput } from "./assign.interface";

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
      message: "Assignment Retrived successfully",
      data: result,
    });
  },
);

const createNewDonationRecord = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload: ICreateDonationRecordInput = {
      assignmentId: req.body.assignmentId,
      notes: req.body.notes ?? null,
    };

    const result =
      await donationAssignmentService.createNewDonationRecord(payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Record create successfully",
      data: result,
    });
  },
);

const updateDonationAssignStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = {
      assignmentId: req.params.id,
      status: req.body.status,
    };

    const result = await donationAssignmentService.updateAssignmentStatus(
      payload as {
        assignmentId: string;
        status: AssignmentStatus;
      },
      userId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Status Updated successfully",
      data: result,
    });
  },
);

export const assignmentController = {
  assingDonor,
  viewDonationAssignment,
  createNewDonationRecord,
  updateDonationAssignStatus,
};
