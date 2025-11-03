import { NextFunction, Request, Response } from "express";
import { env } from "../env";
import ApiError from "../utils/ApiError";
import { logger } from "../utils/logger";

const errorMiddleware = (err: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
   logger.error({
      message: err.message,
      statusCode: (err as ApiError).statusCode,
      path: req.path,
      method: req.method,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
   });

   if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
         success: false,
         message: err.message,
         ...(env.NODE_ENV === "development" && { stack: err.stack })
      });
   }

   const message = err.message || "Internal Server Error";
   const apiError = new ApiError(500, message);
   return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      ...(env.NODE_ENV === "development" && { stack: err.stack })
   });
};

export default errorMiddleware;
