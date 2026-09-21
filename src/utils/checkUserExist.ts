import AppError from "../errors/AppError";
import { prisma } from "../lib/prisma";

export const checkUser = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  if (user?.status === "BLOCKED") {
    throw AppError.forbidden("User is blocked");
  }

  if (!user?.isVerified) {
    throw AppError.conflict("Email is not Verified yet");
  }

  if (user?.isDeleted || user?.status === "DELETED") {
    throw AppError.forbidden("User is Deleted");
  }

  const isPremiumUser = user.isPremiumUser;

  return {
    isPremiumUser,
    user,
  };
};
