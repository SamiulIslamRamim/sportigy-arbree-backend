import crypto from "crypto";

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const getOtpExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 3);
  return expiry;
};