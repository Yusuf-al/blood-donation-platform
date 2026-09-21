import bcrypt from "bcryptjs";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { jwtUtils } from "../../utils/jwt";
import { IJwtpayload, Ilogin } from "./auth.interface";
import AppError from "../../errors/AppError";
import { TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import httpStatus from "http-status";
import { AuthProvider, UserStatus } from "../../../generated/prisma/client";
import { redisClient } from "../../lib/redis";
import { transpoter } from "../../lib/nodemailer";
import { forgetEmailSendEmailTemplates } from "../../utils/emailTemplates";

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

const googleLoginService = async (payload: any) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("Google ID Token Verification Failed", error);
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid Or Expired Google Id Token",
    );
  }

  if (!googleIdTokenPayload) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid Or Expired Google Id Token",
    );
  }

  if (!googleIdTokenPayload.email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google Email Not Found");
  }
  if (!googleIdTokenPayload.name) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google Email User Name Not Found",
    );
  }

  const GoogleAuthUser = await prisma.user.findUnique({
    where: {
      email: googleIdTokenPayload.email,
      googleId: googleIdTokenPayload.sub,
    },
  });

  let user = GoogleAuthUser;

  if (!GoogleAuthUser) {
    const CredentialsUser = await prisma.user.findUnique({
      where: {
        email: googleIdTokenPayload.email,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });

    if (CredentialsUser) {
      if (!CredentialsUser.isVerified) {
        throw new AppError(httpStatus.FORBIDDEN, "Email Not Verified");
      }
      if (CredentialsUser.status === UserStatus.BLOCKED) {
        throw new AppError(httpStatus.FORBIDDEN, "User Is Blocked");
      }

      if (
        CredentialsUser.isDeleted ||
        CredentialsUser.status === UserStatus.DELETED
      ) {
        throw new AppError(httpStatus.FORBIDDEN, "User Is Deleted");
      }

      user = await prisma.user.update({
        where: {
          id: CredentialsUser.id,
        },
        data: {
          googleId: googleIdTokenPayload.sub,
        },
      });
    } else {
      // Google Register
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email: googleIdTokenPayload.email,
          imageUrl: googleIdTokenPayload.picture,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          isVerified: true,
        },
      });
    }
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User Is Blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "User Is Deleted");
  }

  const jwtPayload: IJwtpayload = {
    id: user.id,
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

const forgetPasswordSerivce = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    throw AppError.notFound(`User not found with this ${email}`);
  }

  const ExpireIn = 5 * 60;

  const otpKey = `user-email-check-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: ExpireIn,
    },
  });

  const html = forgetEmailSendEmailTemplates(otpValue, user.name);

  await transpoter.sendMail({
    from: config.email_sender,
    to: user.email,
    subject: "Email Varification",
    html,
  });

  return {
    message: "OTP has been to your for reset your password",
  };
};

export const authService = {
  loginUserService,
  tokenRefresh,
  googleLoginService,
  forgetPasswordSerivce,
};
