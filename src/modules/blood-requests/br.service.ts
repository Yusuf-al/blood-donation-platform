import { date } from "zod";
import {
  BloodGroup,
  BloodRequestStatus,
  RequestStatus,
  RequestUrgency,
  UserRole,
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

const updateBloodRequestStatus = async (
  payload: any,
  requestId: string,
  userId: string,
) => {
  const { status } = payload;

  const existingRequest = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
  });

  if (!existingRequest) {
    throw AppError.notFound("Blood request not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw AppError.notFound("User not found");
  }

  const normalizedStatus = status.trim().toUpperCase() as BloodRequestStatus;

  // Ensure it's a valid enum value before updating
  if (!Object.values(BloodRequestStatus).includes(normalizedStatus)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const validStatuses = Object.values(BloodRequestStatus);
  if (!validStatuses.includes(normalizedStatus)) {
    throw AppError.badRequest(
      `Invalid status '${status}'. Allowed values: ${validStatuses.join(", ")}`,
    );
  }

  const isAdmin = user.role === UserRole.ADMIN;
  const isRequester = existingRequest.requesterId === userId;

  if (!isAdmin && !isRequester) {
    throw AppError.forbidden(
      "You are not authorized to update this blood request",
    );
  }

  // Requester-specific restrictions
  if (isRequester && !isAdmin) {
    // Requesters CANNOT approve requests
    if (normalizedStatus === BloodRequestStatus.APPROVED) {
      throw AppError.forbidden("Only admins can approve blood requests");
    }

    // Requesters CANNOT modify requests that are already APPROVED or FULFILLED
    if (
      existingRequest.status === BloodRequestStatus.APPROVED ||
      existingRequest.status === BloodRequestStatus.FULFILLED
    ) {
      throw AppError.badRequest(
        `Cannot update request because it is already ${existingRequest.status}`,
      );
    }
  }

  if (
    normalizedStatus === BloodRequestStatus.FULFILLED &&
    existingRequest.status !== BloodRequestStatus.APPROVED
  ) {
    throw AppError.badRequest(
      `Cannot fulfill request. Status must be APPROVED first, but current status is '${existingRequest.status}'.`,
    );
  }

  const updatedRequest = await prisma.bloodRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status: normalizedStatus,
      ...(normalizedStatus === BloodRequestStatus.APPROVED && {
        verifiedAt: new Date(),
      }),
      ...(normalizedStatus === BloodRequestStatus.FULFILLED && {
        fulfilledAt: new Date(),
      }),
    },
  });

  return updatedRequest;
};

const viewBloodRequest = async (requestId: string) => {
  const request = await prisma.bloodRequest.findUniqueOrThrow({
    where: {
      id: requestId,
    },
  });

  if (!request) {
    return `No request is found with this ${requestId} id`;
  }

  return request;
};

export const bloodReqService = {
  createNewBloodRequest,
  updateBloodRequestStatus,
  viewBloodRequest,
};
