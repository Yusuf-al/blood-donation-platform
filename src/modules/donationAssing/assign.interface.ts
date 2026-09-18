import { AssignmentStatus } from "../../../generated/prisma/client";

export interface ICreateDonationRecordInput {
  assignmentId: string;
  notes?: string;
}

export interface IUpdateAssingmentStatus {
  assignmentId: string;
  status: AssignmentStatus;
}
