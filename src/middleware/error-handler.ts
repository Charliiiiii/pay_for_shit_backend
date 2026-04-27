import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError, ValidationError } from "../utils/errors.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      status: "error",
      message: "参数校验失败",
      errors,
    });
  }

  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      status: "error",
      message: err.message,
    };
    if (err instanceof ValidationError && err.errors) {
      body.errors = err.errors;
    }
    return res.status(err.statusCode).json(body);
  }

  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : String(err);

  console.error("[unhandled]", err);
  return res.status(500).json({ status: "error", message });
}

export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
