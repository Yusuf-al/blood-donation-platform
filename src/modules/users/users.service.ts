import bcrypt from "bcryptjs";
import config from "../../config";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { IPayload, IUserPayload } from "./users.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { redisClient } from "../../lib/redis";
import { transpoter } from "../../lib/nodemailer";

const createUser = async (payload: IPayload) => {
  const { name, email, password, phone } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isUserExist)
    throw AppError.conflict("User with this email already exist");

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_round),
  );

  const ExpireIn = 5 * 60;

  const otpKey = `user-reg-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: ExpireIn,
    },
  });

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      phone,
    },
  });

  await transpoter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Email Varification",
    html: `<div style="max-width:480px; margin:40px auto; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,.06);"> <div style="padding:24px; text-align:center; border-bottom:1px solid #eee;"> <h2 style="margin:0; color:#d62839;">FAST<span style="color:#263238;">Blood</span></h2> <p style="margin:6px 0 0; font-size:12px; color:#888;">Email Verification</p> </div> <div style="padding:30px;"> <h3 style="margin:0 0 12px; color:#172b4d;">Verify your email address</h3> <p style="font-size:14px; line-height:1.7; color:#5f6c7b;"> Hello <strong>${name}</strong>,<br /> Use the OTP below to verify <strong>${email}</strong>. </p> <div style="margin:24px 0; padding:20px; text-align:center; background:#fff1f2; border:1px solid #ffd9dd; border-radius:10px;"> <div style="font-size:32px; font-weight:700; letter-spacing:8px; color:#d62839;"> ${otpValue} </div> <p style="margin:10px 0 0; font-size:12px; color:#8b6b70;"> Expires in ${ExpireIn / 60} minutes </p> </div> <p style="margin:0; font-size:12px; line-height:1.6; color:#8a94a3;"> If you didn't request this verification, simply ignore this email. Never share your OTP. </p> </div> <div style="padding:18px; text-align:center; background:#fafbfc; font-size:11px; color:#9aa4b2;"> &copy; 2026 FASTBlood. All rights reserved. </div> </div>`,
  });

  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
      email: createdUser.email || email,
    },
    omit: {
      passwordHash: true,
    },
  });

  return user;
};

const verifyUserEmail = async (payload: any) => {
  const otp = payload.otp;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist?.status === "BLOCKED") {
    throw AppError.forbidden("User is blocked");
  }

  if (isUserExist?.isVerified) {
    throw AppError.conflict("Email ALready Verified");
  }

  if (isUserExist?.isDeleted || isUserExist?.status === "DELETED") {
    throw AppError.forbidden("User is Deleted");
  }

  const otpKey = `user-reg-otp:${email}`;

  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw AppError.badRequest("Invalid OTP");
  }

  if (redisOtp !== otp) {
    throw AppError.badRequest("OTP Does Not Match");
  }

  await redisClient.del(otpKey);

  const verifiedUser = await prisma.user.update({
    where: {
      email: isUserExist?.email,
    },
    data: {
      isVerified: true,
    },
  });

  return verifiedUser;
};

const getUserProfile = async (payload: IUserPayload) => {
  const userProfile = await prisma.user.findUnique({
    where: { id: payload.id },

    omit: {
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!userProfile) throw AppError.notFound("User not found");

  return userProfile;
};

const UserProfile = async (payload: string) => {
  const id = payload;

  const userProfile = await prisma.user.findUnique({
    where: { id },
  });

  if (!userProfile) throw AppError.notFound("User not found");

  return userProfile;
};

const updateUserProfile = async (
  userdata: IUserPayload,
  payload: {
    email?: string;
    name?: string;
    phone?: string;
    address?: string;
  },
) => {
  const { id: userId } = userdata;
  const { email, name, phone, address } = payload;

  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!existingUser) {
    throw AppError.notFound("User not found");
  }

  // If email is being changed, make sure another user isn't using it
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (emailExists) {
      throw AppError.conflict("Email already exists");
    }
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      ...(email !== undefined && { email }),
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
    },

    omit: {
      passwordHash: true,
    },
  });

  return updatedUser;
};

const allUsers = async () => {
  const users = await prisma.user.findMany();

  if (users.length === 0) throw AppError.notFound("No users are found");

  return users;
};

export const userService = {
  createUser,
  allUsers,
  getUserProfile,
  updateUserProfile,
  UserProfile,
  verifyUserEmail,
};
