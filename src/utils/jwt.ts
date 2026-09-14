import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { IJwtpayload } from "../modules/auth/auth.service";

const createToken = (
  payload: JwtPayload,
  sec_token: string,
  expiretime: SignOptions,
) => {
  const token = jwt.sign(payload, sec_token, {
    expiresIn: expiretime,
  } as SignOptions);

  return token;
};

const verifyToken = (accessToken: string, sec_token: string) => {
  try {
    const verifiedToken = jwt.verify(accessToken, sec_token);
    if (typeof verifiedToken === "string") throw new Error("Invalid Token");
    return {
      success: true,
      token: verifiedToken,
    };
  } catch (error: any) {
    console.log("Invalid Token", error);
    return {
      success: true,
      error: error.message,
    };
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};
