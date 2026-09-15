import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./modules/users/users.route";
import authRoutes from "./modules/auth/auth.route";
import adminRoute from "./modules/admin/admin.route";
import { sendResponse } from "./utils/sendResponse";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import donorRoutes from "./modules/donors/donors.routes";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

app.get("/", async (req: Request, res: Response) => {
  res.json({
    message: "Application is running",
  });
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/donor", donorRoutes);

app.use((req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 404,
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use(globalErrorHandler);

export default app;
