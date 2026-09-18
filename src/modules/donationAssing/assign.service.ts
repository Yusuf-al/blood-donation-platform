import {
  AvailabilityStatus,
  BloodRequestStatus,
} from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createDonationAssignment = async (payload: any, userId: string) => {
  const { requestId, donorId } = payload;

  if (!requestId || !donorId) {
    throw AppError.badRequest("requestId and donorId are required");
  }

  const isRequestExist = await prisma.bloodRequest.findUniqueOrThrow({
    where: {
      id: requestId,
    },
  });

  if (
    !isRequestExist ||
    isRequestExist.status === BloodRequestStatus.CANCELLED ||
    isRequestExist.status === BloodRequestStatus.FULFILLED
  ) {
    throw AppError.badRequest("This request can't be assinged donor");
  }

  const isDonorExist = await prisma.user.findUniqueOrThrow({
    where: {
      id: donorId,
      role: "DONOR",
    },
    include: {
      donorProfile: true,
    },
  });

  if (isDonorExist?.status === "BLOCKED") {
    throw AppError.forbidden("User is blocked");
  }

  if (!isDonorExist?.isVerified) {
    throw AppError.conflict("Email is not Verified yet");
  }

  if (isDonorExist?.isDeleted || isDonorExist?.status === "DELETED") {
    throw AppError.forbidden("User is Deleted");
  }

  if (!isDonorExist?.donorProfile) {
    throw AppError.badRequest("Donor does not have a completed donor profile");
  }

  if (
    isDonorExist.donorProfile.availabilityStatus !==
    AvailabilityStatus.AVAILABLE
  ) {
    throw AppError.badRequest(
      "Donor is currently marked as unavailable for donation",
    );
  }

  if (isRequestExist.bloodGroup !== isDonorExist.donorProfile.bloodGroup) {
    throw AppError.badRequest("Blood groups do not match");
  }

  const newDonationAssingment = await prisma.donationAssignment.create({
    data: {
      requestId,
      donorId: isDonorExist.id,
      donorProfileId: isDonorExist.donorProfile?.id as string,
      respondedAt: new Date(),
    },
  });

  return newDonationAssingment;
};

const viewAssignemt = async (payload: any) => {
  const assignmentId = payload;

  const assignment = await prisma.donationAssignment.findUniqueOrThrow({
    where: {
      id: assignmentId,
    },
    include: {
      donorProfile: true,
      donor: true,
      request: true,
    },
  });

  const formattedResult = {
    BloodRequest: {
      BloodGroup: assignment.request.bloodGroup,
      Hospital_name: assignment.request.hospitalName,
      Hospital_Location: assignment.request.hospitalLocation,
      Contact_number: assignment.request.contactPhone,
      Urgency: assignment.request.urgency,
      Require_units: assignment.request.requiredUnits,
      Request_Date: assignment.request.createdAt,
    },
    Donor_Profile: {
      Nama: assignment.donor.name,
      Blood_Group: assignment.donorProfile.bloodGroup,
      Phone: assignment.donor.phone,
      Email: assignment.donor.email,
      City: assignment.donorProfile.city,
    },
    donor_assign_date: assignment.assignedAt,
  };

  return formattedResult;
};

export const donationAssignmentService = {
  createDonationAssignment,
  viewAssignemt,
};
