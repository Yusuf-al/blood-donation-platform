import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { bloodReqService } from "./br.service";
import AppError from "../../errors/AppError";
import {
  BloodRequestStatus,
  RequestStatus,
} from "../../../generated/prisma/client";

const createNewBloodRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id;
    if (!req.user?.id) {
      throw AppError.unauthorized("user not found");
    }

    const result = await bloodReqService.createNewBloodRequest(
      req.body,
      id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "New Blood request has been submitted",
      data: result,
    });
  },
);

const updateRequestStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.params.id;

    if (!requestId) {
      throw AppError.unauthorized("Request not found");
    }

    const result = await bloodReqService.updateBloodRequestStatus(
      req.body as any,
      requestId as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Request status has been updated",
      data: result,
    });
  },
);

export const bloodReqController = {
  createNewBloodRequest,
  updateRequestStatus,
};
