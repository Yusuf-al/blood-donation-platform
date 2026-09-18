import { z } from "zod";

// Enum definition matching your Prisma schema
export const AssignmentStatusEnum = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
]);

// 1. Schema for creating a new assignment
export const createAssignmentSchema = z.object({
  requestId: z.string().uuid("Invalid Request ID format"),

  donorId: z.string().uuid("Invalid Donor ID format"),

  status: AssignmentStatusEnum.default("PENDING").optional(),
});

export const assignmentValidation = {
  createAssignmentSchema,
};
