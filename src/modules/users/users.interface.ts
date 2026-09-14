import { UserRole } from "../../../generated/prisma/client";

export interface IPayload {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string;
  address?: string;
  role?: UserRole;
}

export interface IUserPayload {
  id: string;
  email: string;
  role: UserRole;
}
