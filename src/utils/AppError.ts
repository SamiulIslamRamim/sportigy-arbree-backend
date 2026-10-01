import { ERROR_MESSAGES } from "../constants/errorMessages.js";

export class AppError extends Error {
  public readonly code: string;
  public readonly data: unknown = undefined;

  constructor(code: string, options: { message?: string; data?: unknown } = {}) {
    super(options.message ?? ERROR_MESSAGES[code] ?? "An error occurred");
    this.name = "AppError";
    this.code = code;
    this.data = options.data ?? undefined;
  }
}