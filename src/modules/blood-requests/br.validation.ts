import { z } from "zod";

// Define enums to match your schema types
export const BloodGroupEnum = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);

export const RequestUrgencyEnum = z.enum(["NORMAL", "URGENT", "CRITICAL"]);

// Main Zod Schema
export const bloodRequestSchema = z.object({
  bloodGroup: BloodGroupEnum,

  requiredUnits: z
    .number()
    .int("Units must be a whole number")
    .min(1, "At least 1 unit is required")
    .max(10, "Cannot request more than 10 units at once"),

  hospitalName: z
    .string()
    .min(2, "Hospital name must be at least 2 characters")
    .max(100, "Hospital name must not exceed 100 characters"),

  hospitalLocation: z.string().min(3, "Location must be at least 3 characters"),

  contactPhone: z
    .string()
    .min(7, "Phone number is too short")
    .max(15, "Phone number is too long"),

  urgency: RequestUrgencyEnum,

  // Accepts either a Date object or an ISO string and coerces it to a Date
  requiredAt: z.coerce.date(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
});

export const bloodReqValidation = {
  bloodRequestSchema,
};
