import nodemailer from "nodemailer";
import config from "../config";

export const transpoter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password,
  },
});
