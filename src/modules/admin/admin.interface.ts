import {
  AvailabilityStatus,
  BloodGroup,
  UserRole,
  UserStatus,
} from "../../../generated/prisma/client";

export interface IUserQuery {
  searchTerm?: string; // matches against name, email, phone
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface IDonorQuery {
  searchTerm?: string; //
  city?: string;
  bloodGroup?: BloodGroup;
  availabilityStatus?: AvailabilityStatus;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}
