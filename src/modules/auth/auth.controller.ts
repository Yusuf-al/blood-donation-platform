import { NextFunction, Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendRespone } from "../../utils/sendResponse";
import { authService } from "./auth.service";

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;

    const { refreshToken, accessToken } =
      await authService.loginUserService(payload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    sendRespone(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login successfull",
      data: { refreshToken, accessToken },
    });
  },
);

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  const { newAccessToken } = await authService.tokenRefresh(refreshToken);
  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "New Access token created",
    data: newAccessToken,
  });
});

export const authController = {
  loginUser,
  refreshToken,
};
