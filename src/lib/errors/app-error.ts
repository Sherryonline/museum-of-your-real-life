export type AppErrorCode =
  | "AUTHENTICATION_FAILED"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "UNEXPECTED";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status = 500,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AppError";
  }
}

export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  return "Something went wrong. Please try again.";
}
