import {
  AssignmentStatus,
  AvailabilityStatus,
  BloodRequestStatus,
  DonationStatus,
  UserRole,
} from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  IAssignemt,
  ICreateDonationRecordInput,
  IUpdateAssingmentStatus,
} from "./assign.interface";

const createDonationAssignment = async (
  payload: IAssignemt,
  userId: string,
) => {
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

const viewAssignemt = async (payload: string) => {
  const assignmentId = payload;

  const assignment = await prisma.donationAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      donorProfile: true,
      donor: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      request: true,
    },
  });

  if (!assignment) {
    throw AppError.notFound(
      `Donation assignment with ID '${assignmentId}' not found`,
    );
  }

  const formattedResult = {
    id: assignment.id,
    status: assignment.status,
    assignedAt: assignment.assignedAt,
    respondedAt: assignment.respondedAt,
    bloodRequest: {
      id: assignment.request.id,
      bloodGroup: assignment.request.bloodGroup,
      hospitalName: assignment.request.hospitalName,
      hospitalLocation: assignment.request.hospitalLocation,
      contactPhone: assignment.request.contactPhone,
      urgency: assignment.request.urgency,
      requiredUnits: assignment.request.requiredUnits,
      requiredAt: assignment.request.requiredAt,
      createdAt: assignment.request.createdAt,
    },
    donorProfile: {
      name: assignment.donor?.name || "N/A",
      email: assignment.donor?.email || "N/A",
      phone: assignment.donor?.phone || "N/A",
      bloodGroup: assignment.donorProfile?.bloodGroup || null,
      city: assignment.donorProfile?.city || null,
    },
  };

  return formattedResult;
};

const createNewDonationRecord = async (payload: ICreateDonationRecordInput) => {
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

  if (assignment.status !== AssignmentStatus.ACCEPTED) {
    throw AppError.badRequest(
      `Cannot create donation record. Assignment status must be ACCEPTED, but is currently '${assignment.status}'`,
    );
  }

  // Prevent Duplicate Donation Records
  const existingRecord = await prisma.donationRecord.findUnique({
    where: { assignmentId },
  });

  if (existingRecord) {
    throw AppError.conflict(
      "A donation record already exists for this assignment",
    );
  }

  const record = await prisma.donationRecord.create({
    data: {
      assignmentId,
      status: DonationStatus.SCHEDULED,
      notes: notes?.trim() || null,
    },
    include: {
      assignment: {
        include: {
          request: true,
          donorProfile: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  const formatDonationRecordResponse = {
    recordId: record.id,
    status: record.status,
    notes: record.notes || null,
    scheduledAt: record.createdAt,
    updatedAt: record.updatedAt,

    // Assignment Details
    assignment: {
      id: record.assignment.id,
      status: record.assignment.status,
      assignedAt: record.assignment.assignedAt,
      respondedAt: record.assignment.respondedAt,
    },

    // Blood Request Details
    request: {
      id: record.assignment.request.id,
      bloodGroup: record.assignment.request.bloodGroup,
      unitsRequired: record.assignment.request.requiredUnits,
      urgency: record.assignment.request.urgency,
      hospitalName: record.assignment.request.hospitalName,
      hospitalLocation: record.assignment.request.hospitalLocation,
      contactPhone: record.assignment.request.contactPhone,
      requiredAt: record.assignment.request.requiredAt,
    },

    // Donor Profile Details
    donor: {
      id: record.assignment.donorProfile.id,
      name: record.assignment.donorProfile.user?.name || "N/A",
      email: record.assignment.donorProfile.user?.email || "N/A",
      phone: record.assignment.donorProfile.user?.phone || "N/A",
      bloodGroup: record.assignment.donorProfile.bloodGroup,
      city: record.assignment.donorProfile.city,
      lastDonationDate: record.assignment.donorProfile.lastDonationDate,
    },
  };

  return formatDonationRecordResponse;
};

const updateAssignmentStatus = async (
  payload: IUpdateAssingmentStatus,
  userId: string,
) => {
  const { assignmentId, status } = payload;

  const [assignment, user] = await Promise.all([
    prisma.donationAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        donorProfile: true,
        request: true, // Needed to identify the requester
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      include: { donorProfile: true },
    }),
  ]);

  if (!assignment) {
    throw AppError.notFound(
      `Donation Assignment with this ${assignmentId} is not found`,
    );
  }

  if (!user) {
    throw AppError.notFound(`User is not found`);
  }

  const isAdmin = user.role === UserRole.ADMIN;

  const isAssignedDonor = assignment.donorId === user.id;

  const isRequester = assignment.request.requesterId === user.id;

  if (
    assignment.status === AssignmentStatus.CANCELLED ||
    assignment.status === AssignmentStatus.COMPLETED ||
    assignment.status === AssignmentStatus.REJECTED
  ) {
    throw AppError.badRequest(
      `Cannot update assignment. Current status is already ${assignment.status}`,
    );
  }

  switch (status) {
    case AssignmentStatus.ACCEPTED:
    case AssignmentStatus.REJECTED:
      if (!isAssignedDonor) {
        throw AppError.forbidden(
          "Only the assigned donor can accept or reject this assignment",
        );
      }
      break;

    case AssignmentStatus.CANCELLED:
      if (!isAdmin && !isRequester) {
        throw AppError.forbidden(
          "Only an admin or the requester can cancel this assignment",
        );
      }
      break;

    case AssignmentStatus.COMPLETED:
      if (!isAdmin && !isAssignedDonor && !isRequester) {
        throw AppError.forbidden(
          "Only an admin, the assigned donor, or the requester can mark this assignment as completed",
        );
      }
      break;

    default:
      throw AppError.badRequest(`Unsupported status transition: ${status}`);
  }

  const statusMap: Partial<Record<AssignmentStatus, DonationStatus>> = {
    [AssignmentStatus.ACCEPTED]: DonationStatus.SCHEDULED,
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

    if (recordStatus) {
      const isCompleted = status === AssignmentStatus.COMPLETED;

      await tx.donationRecord.updateMany({
        where: { assignmentId: assignmentId },
        data: {
          status: recordStatus,
          ...(isCompleted && {
            donatedAt: new Date(),
          }),
        },
      });

      // Update donor profile's last donation date on completion
      if (isCompleted && assignment.donorProfileId) {
        await tx.donorProfile.update({
          where: { id: assignment.donorProfileId },
          data: {
            lastDonationDate: new Date(),
          },
        });
      }
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
