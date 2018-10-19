export class AppError extends Error {
  constructor(m: string, public code?: number) {
  super(m);

  // Set the prototype explicitly.
  Object.setPrototypeOf(this, AppError.prototype);
  }
}