import {
  AssignmentStatus,
  AvailabilityStatus,
  BloodRequestStatus,
  DonationStatus,
  UserRole,
} from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createDonationAssignment = async (payload: any, userId: string) => {
  const { requestId, donorId } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

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

  const isAdmin = user.role === UserRole.ADMIN;
  const initialStatus = isAdmin
    ? AssignmentStatus.CREATED
    : AssignmentStatus.ACCEPTED;

  const respondedAt = isAdmin ? null : new Date();

  const newDonationAssingment = await prisma.donationAssignment.create({
    data: {
      requestId,
      donorId: isDonorExist.id,
      donorProfileId: isDonorExist.donorProfile?.id as string,
      status: initialStatus,
      respondedAt,
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

const createNewDonationRecord = async (payload: any) => {
  const { assignmentId, notes } = payload;

  const assignment = await prisma.donationAssignment.findUniqueOrThrow({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw AppError.notFound(
      `Donation Assignment with this ${assignmentId} is not found`,
    );
  }

  const newRecord = await prisma.donationRecord.create({
    data: {
      assignmentId,
      status: DonationStatus.SCHEDULED,
      notes: notes ?? null,
    },
    include: {
      assignment: {
        include: {
          request: true,
          donorProfile: true,
        },
      },
    },
  });

  return newRecord;
};

const updateAssignmentStatus = async (payload: {
  assignmentId: string;
  status: AssignmentStatus;
}) => {
  const { assignmentId, status } = payload;

  const assignment = await prisma.donationAssignment.findUniqueOrThrow({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw AppError.notFound(
      `Donation Assignment with this ${assignmentId} is not found`,
    );
  }

  if (
    assignment.status === AssignmentStatus.CANCELLED ||
    assignment.status === AssignmentStatus.COMPLETED ||
    assignment.status === AssignmentStatus.REJECTED
  ) {
    throw AppError.badRequest(
      `Cannot update assignment. Current status is already ${assignment.status}`,
    );
  }

  const statusMap: Partial<Record<AssignmentStatus, DonationStatus>> = {
    [AssignmentStatus.ACCEPTED]: DonationStatus.SCHEDULED, // or your specific status
    [AssignmentStatus.COMPLETED]: DonationStatus.COMPLETED,
    [AssignmentStatus.CANCELLED]: DonationStatus.CANCELLED,
    [AssignmentStatus.REJECTED]: DonationStatus.CANCELLED,
  };

  const recordStatus = statusMap[status];

  const updatedAssignment = await prisma.$transaction(async (tx) => {
    const updated = await tx.donationAssignment.update({
      where: { id: assignmentId },
      data: {
        status: status,
        ...(status === AssignmentStatus.ACCEPTED && {
          respondedAt: new Date(),
        }),
      },
    });

    // Update associated donation record if status mapped & record exists
    if (recordStatus) {
      await tx.donationRecord.updateMany({
        where: { assignmentId: assignmentId },
        data: {
          status: recordStatus,
          ...(status === DonationStatus.COMPLETED && {
            donatedAt: new Date(),
          }),
        },
      });
    }

    return updated;
  });

  return updatedAssignment;
};

export const donationAssignmentService = {
  createDonationAssignment,
  viewAssignemt,
  createNewDonationRecord,
  updateAssignmentStatus,
};

//   await prisma.donationAssignment.update({
//   where: {
//     id: assignmentId,
//   },
//   data: {
//     status: status,
//   },
// });
