import bcrypt from "bcryptjs";
import config from "../../config";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import {
  IPayload,
  IUpdateProfile,
  IUserPayload,
  IVerifyEmail,
} from "./users.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { redisClient } from "../../lib/redis";
import { transpoter } from "../../lib/nodemailer";
import {
  otpSendEmailTemplates,
  registrationConfirmationTemplate,
} from "../../utils/emailTemplates";
import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";

const createUser = async (payload: IPayload) => {
  const { name, email, password, phone, profileImage } = payload;

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

  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },

          async (error, result) => {
            if (error) return reject(error);
            if (!result) {
              return reject(new Error("No result from cloudinary"));
            }
            resolve(result);
          },
        )
        .end(profileImage);
    },
  );

  const imageUrl = cloudinaryResult.secure_url;
  const imagePublicId = cloudinaryResult.public_id;

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      phone,
      imageUrl,
      imagePublicId,
    },
  });

  const html = otpSendEmailTemplates(otpValue, email, name);

  await transpoter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Email Varification",
    html,
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

const verifyUserEmail = async (payload: IVerifyEmail) => {
  const otp = payload.otp;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (!isUserExist) {
    throw AppError.notFound("User not found with this email");
  }

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

  if (redisOtp.trim() !== otp.trim()) {
    throw AppError.badRequest("OTP does not match");
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

  const html = registrationConfirmationTemplate(isUserExist?.name!);

  await transpoter
    .sendMail({
      from: config.email_sender,
      to: isUserExist?.email,
      subject: "Registration Confirmation Email",
      html,
    })
    .catch((err) => {
      console.error("Failed to send registration confirmation email:", err);
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
  payload: IUpdateProfile,
) => {
  const { id: userId } = userdata;
  const { email, name, phone, status, image } = payload;

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

  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },

          async (error, result) => {
            if (error) return reject(error);
            if (!result) {
              return reject(new Error("No result from cloudinary"));
            }
            resolve(result);
          },
        )
        .end(image);
    },
  );

  const imageUrl = cloudinaryResult.secure_url;
  const imagePublicId = cloudinaryResult.public_id;

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      ...(email !== undefined && { email }),
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(status !== undefined && { status }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(imagePublicId !== undefined && { imagePublicId }),
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
