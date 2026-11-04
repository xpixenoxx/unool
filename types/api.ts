// ── Shared API response types ─────────────────────────────────────
// Consistent response envelope for all API routes.
// Use ApiResponse<T> as the return type annotation in route handlers.

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Type guard — narrows ApiResponse<T> to the success branch */
export function isApiSuccess<T>(res: ApiResponse<T>): res is ApiSuccessResponse<T> {
  return 'data' in res;
}

