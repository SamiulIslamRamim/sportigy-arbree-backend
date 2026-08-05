export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  error_code: string | number | null;
  data: T | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
} 