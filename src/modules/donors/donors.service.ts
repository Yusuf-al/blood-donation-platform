import { tr } from "zod/v4/locales/index.js";
import { BloodGroup, UserRole } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IDonorProfile } from "./donors.interface";
import { checkUser } from "../../utils/checkUserExist";

const createDonor = async (payload: IDonorProfile, userId: string) => {
  const { bloodGroup, dateOfBirth, city, address, lastDonationDate } = payload;

  const { user } = await checkUser(userId);

  const today = new Date();
  const brithDate = new Date(dateOfBirth);
  const age = today.getFullYear() - brithDate.getFullYear();

  if (age < 18) {
    throw AppError.badRequest("Your not eligible for become a donor");
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
        id: user.id,
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

const donorProfile = async (payload: string, userId: string) => {
  const id = payload;

  const { user, isPremiumUser } = await checkUser(userId);

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
  const canViewContact =
    isPremiumUser ||
    user.role === UserRole.ADMIN ||
    (user.role === UserRole.DONOR && profile.userId === user.id);

  const donorResult = {
    name: profile.user.name,
    age: age,
    bloodGrp: profile.bloodGroup,
    city: profile.city,
    address: profile.address,
    email: canViewContact
      ? profile.user.email
      : "Only available for Premium users",

    phone: canViewContact
      ? profile.user.phone
      : "Only available for Premium users",
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
