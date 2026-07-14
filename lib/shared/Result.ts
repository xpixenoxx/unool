export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const match = <T, E, R>(
  result: Result<T, E>,
  onOk: (value: T) => R,
  onErr: (error: E) => R
): R => (result.ok ? onOk(result.value) : onErr(result.error));

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (!result.ok) throw result.error;
  return result.value;
};

export const unwrapErr = <T, E>(result: Result<T, E>): E => {
  if (result.ok) throw new Error('Expected error but got success');
  return result.error;
};