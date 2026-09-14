// import bcrypt from "bcryptjs";
// import config from "../../config";
// import { prisma } from "../../lib/prisma";
// import { jwtUtils } from "../../utils/jwt";
// import jwt from "jsonwebtoken";
// import { UserRole } from "../../../generated/prisma/client";
// import { IPayload, IUserPayload } from "./users.interface";
// import AppError from "../../errors/AppError";

// const createUser = async (payload: IPayload) => {
//   const { id, name, email, password, phone, profileImage, address, role } =
//     payload;

//   const isUserExist = await prisma.user.findUnique({
//     where: {
//       email,
//       id,
//     },
//   });

//   if (isUserExist)
//     throw AppError.conflict("User with this email already exist");

//   const hashedPassword = await bcrypt.hash(
//     password,
//     Number(config.bcrypt_salt_round),
//   );

//   const createdUser = await prisma.user.create({
//     data: {
//       name,
//       email,
//       password: hashedPassword,
//       phone,
//       profileImage,
//       role,
//       address,
//     },
//   });

//   const user = await prisma.user.findUnique({
//     where: {
//       id: createdUser.id,
//       email: createdUser.email || email,
//     },
//     omit: {
//       password: true,
//     },
//   });

//   return user;
// };

// const getUserProfile = async (payload: IUserPayload) => {
//   const userProfile = await prisma.user.findUnique({
//     where: { id: payload.id },
//     include: {
//       properties: {
//         select: {
//           id: true,
//           title: true,
//           bedrooms: true,
//           bathrooms: true,
//           city: true,
//           address: true,
//           rent: true,
//           status: true,
//           rentalRequests: {
//             select: {
//               id: true,
//               moveInDate: true,
//               moveOutDate: true,
//               totalPrice: true,
//               status: true,
//               tenant: {
//                 select: {
//                   name: true,
//                   email: true,
//                   phone: true,
//                 },
//               },
//             },
//           },
//         },
//       },
//       rentalRequests: {
//         include: {
//           property: {
//             select: {
//               title: true,
//               city: true,
//             },
//           },
//         },
//       },
//       tenantPayments: {
//         include: {
//           property: true,
//         },
//       },
//     },
//     omit: {
//       password: true,
//       createdAt: true,
//       updatedAt: true,
//     },
//   });

//   if (!userProfile) throw AppError.notFound("User not found");

//   return userProfile;
// };

// const UserProfile = async (payload: string) => {
//   const id = payload;

//   const userProfile = await prisma.user.findUnique({
//     where: { id },
//   });

//   if (!userProfile) throw AppError.notFound("User not found");

//   return userProfile;
// };

// const updateUserProfile = async (
//   userdata: IUserPayload,
//   payload: {
//     email?: string;
//     name?: string;
//     phone?: string;
//     address?: string;
//   },
// ) => {
//   const { id: userId } = userdata;
//   const { email, name, phone, address } = payload;

//   const existingUser = await prisma.user.findUnique({
//     where: {
//       id: userId,
//     },
//   });

//   if (!existingUser) {
//     throw AppError.notFound("User not found");
//   }

//   // If email is being changed, make sure another user isn't using it
//   if (email && email !== existingUser.email) {
//     const emailExists = await prisma.user.findUnique({
//       where: {
//         email,
//       },
//     });

//     if (emailExists) {
//       throw AppError.conflict("Email already exists");
//     }
//   }

//   const updatedUser = await prisma.user.update({
//     where: {
//       id: userId,
//     },

//     data: {
//       ...(email !== undefined && { email }),
//       ...(name !== undefined && { name }),
//       ...(phone !== undefined && { phone }),
//       ...(address !== undefined && { address }),
//     },

//     omit: {
//       password: true,
//     },
//   });

//   return updatedUser;
// };

// const allUsers = async () => {
//   const users = await prisma.user.findMany();

//   if (users.length === 0) throw AppError.notFound("No users are found");

//   return users;
// };

// export const userService = {
//   createUser,
//   allUsers,
//   getUserProfile,
//   updateUserProfile,
//   UserProfile,
// };
