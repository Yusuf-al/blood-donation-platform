import bcrypt from "bcryptjs";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtUtils } from "../../utils/jwt";
import { Ilogin } from "./auth.interface";
import AppError from "../../errors/AppError";

export interface IJwtpayload {
  id: string;
  name: string;
  email: string;
  role: string;
}
const loginUserService = async (payload: Ilogin) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const checkPass = await bcrypt.compare(
    password,
    user?.passwordHash as string,
  );

  if (!checkPass) throw AppError.unauthorized("Invalid email or password");

  if (user.status === "BLOCKED") {
    throw AppError.forbidden("Your account has been blocked. Contact support.");
  }

  const jwtPayload: IJwtpayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const tokenRefresh = async (token: string) => {
  const refreshTokenData = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!refreshTokenData.success || !refreshTokenData.token) {
    throw AppError.unauthorized(
      refreshTokenData.error ?? "Invalid refresh token",
    );
  }

  const { id } = refreshTokenData.token as JwtPayload;

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
  });

  if (user.status === "BLOCKED") {
    throw AppError.forbidden("Your account has been blocked. Contact support.");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  return { newAccessToken };
};

export const authService = {
  loginUserService,
  tokenRefresh,
};
