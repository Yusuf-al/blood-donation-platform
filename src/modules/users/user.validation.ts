import z from "zod";

const userStatusEnum = z
  .enum(["ACTIVE", "DEACTIVE", "BLOCKED", "SUSPENDED", "DELETED"])
  .optional();

const userRegistrationZodSchema = z.object({
  name: z
    .string({ message: "Name must be a string." })
    .min(3, "Name must be at least 3 characters long.")
    .max(50, "Name must not exceed 50 characters."),

  email: z.email("Invalid email address."),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long.")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter.")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least 1 number.")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least 1 special character.",
    ),

  phone: z
    .string()
    .regex(/^[0-9]+$/, "Phone number should contain only numbers.")
    .min(10, "Phone number must be at least 10 digits long.")
    .max(15, "Phone number must not exceed 15 digits.")
    .optional(),
});

const userUpdateZodSchema = z.object({
  name: z
    .string({ message: "Name must be a string." })
    .min(3, "Name must be at least 3 characters long.")
    .max(50, "Name must not exceed 50 characters.")
    .optional(),

  email: z.email("Invalid email address.").optional(),

  status: userStatusEnum,
  phone: z
    .string()
    .regex(/^[0-9]+$/, "Phone number should contain only numbers.")
    .min(10, "Phone number must be at least 10 digits long.")
    .max(15, "Phone number must not exceed 15 digits.")
    .optional(),
});

export const UserValidation = {
  userRegistrationZodSchema,
  userUpdateZodSchema,
};
