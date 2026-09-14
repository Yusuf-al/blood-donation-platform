import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { adminServices } from "./admin.service";
import { sendRespone } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { UserRole, UserStatus } from "../../../generated/prisma/client";
import { IUserQuery } from "./admin.interface";

const allUsersFromDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const usersResult = await adminServices.allUser(req.query as IUserQuery);

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All Users",
      data: usersResult,
    });
  },
);

const updateUserStatusIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const { isActive } = req.body;

    const result = await adminServices.updateUserStatus(
      isActive as UserStatus,
      userId as string,
    );

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User Status updated successfully",
      data: result,
    });
  },
);

const updateUserRoleIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const adminId = req.user?.id;
    const { role } = req.body;
    const userId = req.params.id;
    const result = await adminServices.updateUserRole(
      adminId as string,
      role as UserRole,
      userId as string,
    );

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User role updated successfully",
      data: result,
    });
  },
);

export const adminController = {
  allUsersFromDB,
  updateUserStatusIntoDB,
  updateUserRoleIntoDB,
};
