import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { userService } from "./users.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import {
  IPayload,
  IUpdateProfile,
  IUserPayload,
  IVerifyEmail,
} from "./users.interface";

const createUserIntoDB = catchAsync(async (req: Request, res: Response) => {
  const imageFile = req?.file?.buffer;
  const payload: IPayload = {
    email: req.body.email,
    name: req.body.name,
    phone: req.body.phone,
    password: req.body.password,
    profileImage: imageFile,
  };

  const user = await userService.createUser(payload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
    data: user,
  });
});

const verifyEmailByOTP = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.verifyUserEmail(req.body as IVerifyEmail);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Email verified successfully",
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
    sendResponse(res, {
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
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Information ",
    data: myProfile,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userData = req.user;
  const imageFile = req.file?.buffer;

  const payload: IUpdateProfile = {
    email: req.body.email,
    name: req.body.name,
    phone: req.body.phone,
    status: req.body.status,
    image: imageFile,
  };

  if (!userData) throw AppError.notFound("User not found");

  const updatedData = await userService.updateUserProfile(userData, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Information updated successfully",
    data: updatedData,
  });
});

export const userController = {
  createUserIntoDB,
  getMyProfile,
  getProfile,
  updateMyProfile,
  verifyEmailByOTP,
};
