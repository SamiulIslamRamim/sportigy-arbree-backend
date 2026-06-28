import jwt from "jsonwebtoken";
import { JwtPayload, JwtRefreshPayload } from "../types/auth.type.js";

export const generateAccessToken = (user: { id: string;}): string => {
  return jwt.sign(
    { id: user.id},
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user: { id: string }): string => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" }
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtRefreshPayload;
};