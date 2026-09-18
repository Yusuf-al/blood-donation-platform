import { BloodGroup } from "../../../generated/prisma/client";

export interface IDonorProfile {
  bloodGroup: BloodGroup;
  dateOfBirth: Date;
  city: string;
  address?: string;
  lastDonationDate?: Date;
}
