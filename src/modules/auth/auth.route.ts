import { Router } from "express";
import { authController } from "./auth.controller";

const authRoutes = Router();

authRoutes.post("/login", authController.loginUser);
authRoutes.post("/google", authController.googleLogin);
authRoutes.post("/forget-password", authController.forgetPassword);
authRoutes.post("/reset-password", authController.resetPassword);
authRoutes.post("/refresh-token", authController.refreshToken);

export default authRoutes;
