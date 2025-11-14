import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../models/types';

/**
 * Standardized API response helpers
 */

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400
): void => {
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message?: string
): void => {
  sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): void => {
  const totalPages = Math.ceil(total / limit);
  
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
  
  res.status(200).json(response);
};

export const sendUnauthorized = (res: Response, message?: string): void => {
  sendError(res, message || 'Unauthorized', 401);
};

export const sendForbidden = (res: Response, message?: string): void => {
  sendError(res, message || 'Forbidden', 403);
};

export const sendNotFound = (res: Response, message?: string): void => {
  sendError(res, message || 'Not found', 404);
};

export const sendServerError = (res: Response, message?: string): void => {
  sendError(res, message || 'Internal server error', 500);
};
