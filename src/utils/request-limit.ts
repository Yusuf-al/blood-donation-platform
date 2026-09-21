import AppError from "../errors/AppError";
import { prisma } from "../lib/prisma";

const FREE_REQUEST_LIMIT = 3;
const PREMIUM_REQUEST_LIMIT = 10;

export const checkMonthlyRequstLimit = async (
  userId: string,
  isPremiumUser: boolean,
) => {
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const requestCount = await prisma.bloodRequest.count({
    where: {
      requesterId: userId,
      createdAt: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
  });

  const limit = isPremiumUser ? PREMIUM_REQUEST_LIMIT : FREE_REQUEST_LIMIT;

  if (requestCount >= limit) {
    throw AppError.forbidden(
      `Monthly blood request limit reached. ${
        isPremiumUser ? "Premium" : "Free"
      } users can make ${limit} requests per month.`,
    );
  }

  return {
    used: requestCount,
    limit,
    remaining: limit - requestCount,
  };
};
