// === Types API pour résoudre les erreurs TypeScript ===

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
}
