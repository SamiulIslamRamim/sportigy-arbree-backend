export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  error_code: string | number | null;
  data: T | null;
}