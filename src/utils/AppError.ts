import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import { ERROR_STATUS_MAP } from "../constants/errorstatusMap.js";

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly data: unknown = undefined;

  constructor(
    code: string,
    options: { message?: string; data?: unknown; statusCode?: number } = {},
  ) {
    const message = options.message ?? ERROR_MESSAGES[code] ?? "An error occurred";
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = options.statusCode ?? ERROR_STATUS_MAP[code] ?? 500;
    this.data = options.data ?? undefined;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}