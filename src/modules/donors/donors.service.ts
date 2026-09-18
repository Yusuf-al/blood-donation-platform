import { tr } from "zod/v4/locales/index.js";
import { BloodGroup, UserRole } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IDonorProfile } from "./donors.interface";

const createDonor = async (payload: IDonorProfile, userId: string) => {
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

  if (!bGroup) {
    throw AppError.badRequest(`Invalid blood group provided: ${bloodGroup}`);
  }

  const newDonor = await prisma.$transaction(async (tx) => {
    // 1. Update the user's role
    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        role: UserRole.DONOR,
      },
    });

    // 2. Create the donor profile
    return tx.donorProfile.create({
      data: {
        userId,
        dateOfBirth: new Date(dateOfBirth),
        bloodGroup: bGroup,
        city,
        address,
        lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
      },
      include: {
        user: true,
      },
    });
  });

  const donorResult = {
    name: newDonor.user.name,
    DOB: newDonor.dateOfBirth,
    bloodGrp: newDonor.bloodGroup,
    city: newDonor.city,
    address: newDonor.address,
    email: newDonor.user.email,
    phone: newDonor.user.phone,
    availabilityStatus: newDonor.availabilityStatus,
  };

  return donorResult;
};

const donorProfile = async (payload: string) => {
  const id = payload;

  const profile = await prisma.donorProfile.findFirst({
    where: {
      id: id,
    },
    include: {
      user: true,
    },
  });

  if (!profile || profile.user.isDeleted) {
    throw AppError.notFound("Donor not found");
  }

  const today = new Date();
  const brithDate = new Date(profile.dateOfBirth);

  const age = today.getFullYear() - brithDate.getFullYear();

  const donorResult = {
    name: profile.user.name,
    age: age,
    bloodGrp: profile.bloodGroup,
    city: profile.city,
    address: profile.address,
    email: profile.user.email,
    phone: profile.user.phone,
    availabilityStatus: profile.availabilityStatus,
  };

  return donorResult;
};

const approvedDonorApplication = async (id: string) => {
  const profile = await prisma.donorProfile.findFirst({
    where: {
      id: id,
    },
  });

  if (!profile) {
    throw AppError.notFound("Donor profile not found");
  }

  const approvedProfile = await prisma.donorProfile.update({
    where: {
      id: profile.id,
    },
    data: {
      eligibilityVerified: true,
    },
  });

  return approvedProfile;
};

export const donorServices = {
  createDonor,
  donorProfile,
  approvedDonorApplication,
};
