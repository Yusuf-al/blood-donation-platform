import {
  BloodGroup,
  BloodRequestStatus,
  RequestStatus,
  RequestUrgency,
} from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createNewBloodRequest = async (payload: any, userId: string) => {
  const {
    bloodGroup,
    requiredUnits,
    hospitalName,
    hospitalLocation,
    contactPhone,
    urgency,
    requiredAt,
    description,
  } = payload;

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

  const normalizedUrgency = urgency
    ?.toString()
    .trim()
    .toUpperCase() as RequestUrgency;

  if (!Object.values(RequestUrgency).includes(normalizedUrgency)) {
    throw AppError.badRequest(`Invalid urgency level provided: ${urgency}`);
  }

  // 4. Create Record
  const newRequest = await prisma.bloodRequest.create({
    data: {
      requesterId: isUserExist.id,
      bloodGroup: bGroup,
      requiredUnits: Number(requiredUnits),
      hospitalName,
      hospitalLocation,
      contactPhone,
      urgency: normalizedUrgency,
      requiredAt: new Date(requiredAt),
      description: description || null,
    },
  });

  if (!newRequest) {
    throw AppError.badRequest("Failed to create new blood request");
  }

  return newRequest;
};

const updateBloodRequestStatus = async (payload: any, requestId: string) => {
  const { status } = payload;
  const normalizedStatus = status.trim().toUpperCase() as BloodRequestStatus;
  console.log(normalizedStatus);

  // Ensure it's a valid enum value before updating
  if (!Object.values(BloodRequestStatus).includes(normalizedStatus)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const updatedRequest = await prisma.bloodRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status: normalizedStatus,
    },
  });

  if (!updatedRequest) {
    throw AppError.notFound("Request Not found");
  }

  return updatedRequest;
};

export const bloodReqService = {
  createNewBloodRequest,
  updateBloodRequestStatus,
};
