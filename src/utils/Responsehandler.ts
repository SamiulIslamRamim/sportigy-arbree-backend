import { Response } from "express";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/errorMessages.js";
import { ApiResponse } from "../types/response";
import { ERROR_STATUS_MAP } from "../constants/errorstatusMap.js";

const toErrorCode = (code: string): string | number =>
  /^\d+$/.test(code) ? Number(code) : code;

export class ResponseHandler {
  static success<T = Record<string, unknown>>(
    res: Response,
    message: string,
    data: T = {} as T,
    statusCode = 200,
  ): void {
    const msg = SUCCESS_MESSAGES[message] ?? message;
    res.status(statusCode).json({
      success: true,
      message: msg,
      error_code: null,
      data,
    } satisfies ApiResponse<T>);
  }

  static error(
    res: Response,
    code: string,
    message?: string,
    data: unknown = {},
  ): void {
    const status = ERROR_STATUS_MAP[code] ?? 500;
    const msg = message ?? ERROR_MESSAGES [code] ?? "An error occurred";
    res.status(status).json({
      success: false,
      message: msg,
      error_code: toErrorCode(code),
      data: data ?? {},
    } satisfies ApiResponse);
  }
}