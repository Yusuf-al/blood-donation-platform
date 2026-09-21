import { AssignmentStatus } from "../../../generated/prisma/client";

export interface ICreateDonationRecordInput {
  assignmentId: string;
  notes?: string;
}

export interface IUpdateAssingmentStatus {
  assignmentId: string;
  status: AssignmentStatus;
}

export interface IAssignemt {
  requestId: string;
  donorId: string;
}
