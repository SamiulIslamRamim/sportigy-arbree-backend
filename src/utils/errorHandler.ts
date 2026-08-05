import { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError";
import { ResponseHandler } from "./Responsehandler";
import { ERROR_CODES } from "../constants/errorCodes";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { mapPrismaError } from "../constants/prismaErrorMap";


export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    ResponseHandler.error(res, err.code, err.message, err.data);
    return;
  }

  if (err instanceof ZodError) {
    ResponseHandler.error(res, ERROR_CODES.FIELD_VALIDATION_FAILED, undefined, err.flatten());
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    ResponseHandler.error(res, mapPrismaError(err));
    return;
  }

  console.error("Unhandled error:", err);
  ResponseHandler.error(res, ERROR_CODES.APP_SERVER_ERROR);
};