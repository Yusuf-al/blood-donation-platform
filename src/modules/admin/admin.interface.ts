import { UserRole, UserStatus } from "../../../generated/prisma/client";

export interface IUserQuery {
  searchTerm?: string; // matches against name, email, phone
  role?: UserRole;
  isActive?: UserStatus;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}
