import { UserRole } from "../../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        id: string;
        role: UserRole;
      };
    }
  }
}
