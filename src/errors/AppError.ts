import httpStatus from "http-status";

class AppError extends Error {
  public statusCode: number;

  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = "Bad request") {
    return new AppError(httpStatus.BAD_REQUEST, message);
  }

  static unauthorized(message = "You are not authorized") {
    return new AppError(httpStatus.UNAUTHORIZED, message);
  }

  static forbidden(message = "You do not have permission to do this") {
    return new AppError(httpStatus.FORBIDDEN, message);
  }

  static notFound(message = "Resource not found") {
    return new AppError(httpStatus.NOT_FOUND, message);
  }

  static conflict(message = "Resource already exists") {
    return new AppError(httpStatus.CONFLICT, message);
  }
}

export default AppError;
