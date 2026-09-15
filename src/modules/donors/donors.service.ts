import { tr } from "zod/v4/locales/index.js";
import { BloodGroup } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createDonor = async (payload: any, userId: string) => {
  const { bloodGroup, dateOfBirth, city, address, lastDonationDate } = payload;

  const isUserExist = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  if (isUserExist?.status === "BLOCKED") {
    throw AppError.forbidden("User is blocked");
  }

  if (!isUserExist?.isVerified) {
    throw AppError.conflict("Email is not Verified yet");
  }

  if (isUserExist?.isDeleted || isUserExist?.status === "DELETED") {
    throw AppError.forbidden("User is Deleted");
  }

  // 1. Fixed TypeScript Map: Maps string inputs directly to your BloodGroup Enum types cleanly
  const bloodGroupMap: Record<string, BloodGroup> = {
    "A+": BloodGroup.A_POSITIVE,
    "A-": BloodGroup.A_NEGATIVE,
    "B+": BloodGroup.B_POSITIVE,
    "B-": BloodGroup.B_NEGATIVE,
    "AB+": BloodGroup.AB_POSITIVE,
    "AB-": BloodGroup.AB_NEGATIVE,
    "O+": BloodGroup.O_POSITIVE,
    "O-": BloodGroup.O_NEGATIVE,
  };

  // Safe normalization handling potential null/undefined payloads
  const normalizedGroup = bloodGroup?.trim().toUpperCase();
  const bGroup = bloodGroupMap[normalizedGroup];

  // 2. Fixed critical error: Prevents compilation failure by throwing if bloodGroup is invalid
  if (!bGroup) {
    throw AppError.badRequest(`Invalid blood group provided: ${bloodGroup}`);
  }

  const newDonor = await prisma.donorProfile.create({
    data: {
      userId: userId,
      dateOfBirth: new Date(dateOfBirth), // 3. Ensured Date mapping matches typical Prisma DateTime structures
      bloodGroup: bGroup,
      city,
      address,
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null, // Handling optional dates safely
    },
  });

  const donorResult = await prisma.donorProfile.findFirst({
    where: {
      userId: newDonor.userId,
    },
    select: {
      user: {
        select: {
          name: true,
          phone: true,
          email: true,
        },
      },
      bloodGroup: true,
      city: true,
      address: true,
      // Move relation inclusion inside the select statement
    },
  });

  return donorResult;
};

export const donorServices = {
  createDonor,
};
