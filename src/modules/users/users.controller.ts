import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { userService } from "./users.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendRespone } from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { IUserPayload } from "./users.interface";

const createUserIntoDB = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
    data: user,
  });
});

const getMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.user;

    if (!userData) throw AppError.notFound("User not found ");

    const myProfile = await userService.getUserProfile(
      userData as IUserPayload,
    );
    sendRespone(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Information ",
      data: myProfile,
    });
  },
);

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) throw AppError.notFound("User not found");

  const myProfile = await userService.UserProfile(id as string);
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Information ",
    data: myProfile,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userData = req.user;

  if (!userData) throw AppError.notFound("User not found");

  const updatedData = await userService.updateUserProfile(userData, req.body);

  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Information updated successfully",
    data: updatedData,
  });
});
const getAllUserFromDB = catchAsync(async (req: Request, res: Response) => {
  const userData = await userService.allUsers();

  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Users Informations ",
    data: userData,
  });
});

export const userController = {
  createUserIntoDB,
  getMyProfile,
  getProfile,
  updateMyProfile,
  getAllUserFromDB,
};
