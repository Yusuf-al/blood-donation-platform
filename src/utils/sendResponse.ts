import { Response } from "express";

type TMeta = {
  page: number;
  limit: number;
  total: number;
};
type TRespone<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
  meta?: TMeta;
  path?: string;
};

export const sendRespone = <T>(res: Response, data: TRespone<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
    meta: data.meta,
    error: data.error,
  });
};
