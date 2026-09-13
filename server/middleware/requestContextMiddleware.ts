/* eslint-disable no-unused-vars */
import crypto from 'node:crypto';
import type { RequestHandler } from 'express';

declare global {
  namespace Express { interface Request { requestId: string; } }
}

export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};
