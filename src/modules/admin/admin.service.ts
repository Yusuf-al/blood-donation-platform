import {
  AssignmentStatus,
  AvailabilityStatus,
  BloodRequestStatus,
  Prisma,
  UserRole,
  UserStatus,
} from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  buildPaginationMeta,
  calculatePagination,
} from "../../utils/paginationHelper";
import { IUserQuery } from "./admin.interface";

const userSearchableFields: (keyof Prisma.UserWhereInput)[] = [
  "name",
  "email",
  "phone",
];

const allUser = async (query: IUserQuery) => {
  const { searchTerm, role, status } = query;

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(query);

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (role) {
    andConditions.push({ role });
  }

  if (status) {
    andConditions.push({ status });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        isActive: true,
        profileImage: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.user.count({ where: whereConditions }),
  ]);

  return {
    data: users,
    meta: buildPaginationMeta(total, { page, limit }),
  };
};

const updateUserStatus = async (status: UserStatus, userId: string) => {
  const updatedStatus = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isActive: status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  return updatedStatus;
};

const updateUserRole = async (
  adminId: string,
  newRole: UserRole,
  userId: string,
) => {
  const admin = await prisma.user.findUniqueOrThrow({
    where: {
      id: adminId,
      role: UserRole.ADMIN,
    },
  });

  if (!admin) throw AppError.unauthorized("Only Admin can upadte users role");

  const updatedRole = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: newRole,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  return updatedRole;
};

const deleteUser = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDeleted: false,
    },
    include: {
      donorProfile: true,
    },
  });

  if (!user) {
    throw AppError.notFound("Active user not found");
  }

  const deletedUser = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        status: "DELETED",
      },
    });

    // Update donor profile ONLY if it exists for this user
    if (user.donorProfile) {
      await tx.donorProfile.update({
        where: { userId: user.id },
        data: {
          availabilityStatus: AvailabilityStatus.UNAVAILABLE,
        },
      });
    }

    // Cancel all active donation assignments linked to this donor
    await tx.donationAssignment.updateMany({
      where: {
        donorId: user.id,
        status: { in: [AssignmentStatus.CREATED, AssignmentStatus.ACCEPTED] },
      },
      data: {
        status: AssignmentStatus.CANCELLED,
      },
    });

    // Cancel all open blood requests created by this user
    await tx.bloodRequest.updateMany({
      where: {
        requesterId: user.id,
        status: {
          in: [BloodRequestStatus.PENDING, BloodRequestStatus.APPROVED],
        },
      },
      data: {
        status: BloodRequestStatus.CANCELLED,
      },
    });

    return updatedUser;
  });

  return deletedUser;
};

export const adminServices = {
  allUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
