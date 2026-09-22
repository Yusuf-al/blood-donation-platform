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
import { checkUser } from "../../utils/checkUserExist";
import {
  buildPaginationMeta,
  calculatePagination,
} from "../../utils/paginationHelper";
import { IDonorQuery, IUserQuery } from "./admin.interface";

const userSearchableFields: (keyof Prisma.UserWhereInput)[] = [
  "name",
  "email",
  "phone",
];

// const donorProfileSearchableFields: (keyof Prisma.DonorProfileWhereInput)[] = [
//   "city",
//   "address",
//   "bloodGroup",
// ];

const allUser = async (query: IUserQuery) => {
  const { searchTerm, role, status } = query;

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(query);

  const andConditions: Prisma.UserWhereInput[] = [];

  andConditions.push({
    isDeleted: false,
  });

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
        imageUrl: true,
        isPremiumUser: true,
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

const donorProfileSearchableFields: (keyof Prisma.DonorProfileWhereInput)[] = [
  "city",
  "address",
];

const allDonors = async (query: IDonorQuery) => {
  const { searchTerm, bloodGroup, availabilityStatus } = query;

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(query);

  const andConditions: Prisma.DonorProfileWhereInput[] = [];

  andConditions.push({
    user: {
      isDeleted: false,
    },
  });

  if (searchTerm) {
    andConditions.push({
      OR: donorProfileSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (bloodGroup) {
    andConditions.push({ bloodGroup });
  }
  if (availabilityStatus) {
    andConditions.push({ availabilityStatus });
  }

  const whereConditions: Prisma.DonorProfileWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [donorProfiles, total] = await Promise.all([
    prisma.donorProfile.findMany({
      where: whereConditions,
      select: {
        id: true,
        bloodGroup: true,
        city: true,
        address: true,
        dateOfBirth: true,
        lastDonationDate: true,
        availabilityStatus: true,

        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.donorProfile.count({ where: whereConditions }),
  ]);

  return {
    data: donorProfiles,
    meta: buildPaginationMeta(total, { page, limit }),
  };
};

const updateUserStatus = async (status: UserStatus, userId: string) => {
  const { user } = await checkUser(userId);
  const updatedStatus = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      status: status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
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

  const { user } = await checkUser(userId);

  const updatedRole = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: newRole,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return updatedRole;
};

const deleteUser = async (userId: string) => {
  const { user } = await checkUser(userId);

  const userProfile = await prisma.user.findFirst({
    where: {
      id: user.id,
      isDeleted: false,
    },
    include: {
      donorProfile: true,
    },
  });

  if (!userProfile) {
    throw AppError.notFound("Active user not found");
  }

  const deletedUser = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        status: UserStatus.DELETED,
      },
    });

    // Update donor profile ONLY if it exists for this user
    if (userProfile.donorProfile) {
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
        donorId: userProfile.id,
        status: { in: [AssignmentStatus.CREATED, AssignmentStatus.ACCEPTED] },
      },
      data: {
        status: AssignmentStatus.CANCELLED,
      },
    });

    // Cancel all open blood requests created by this user
    await tx.bloodRequest.updateMany({
      where: {
        requesterId: userProfile.id,
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
  allDonors,
};
