import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../error/ApiError.js';

export const errorHandlingMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.code, message: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
};
