import { NextFunction, Request, Response } from "express";

export interface User {
   id: number;
   name: string;
   email: string;
}

export interface CacheStats {
   size: number;
   maxSize: number;
   hits: number;
   misses: number;
   hitRate: string;
   averageResponseTime?: string;
}

export interface ApiResponse<T = any> {
   success: boolean;
   message?: string;
   data?: T;
   error?: string;
   retryAfter?: string;
}

export interface CreateUserRequest {
   name: string;
   email: string;
}

type AuthRequestInfo = {
   userId: string;
   email: string;
   id: string;
   username: string;
   fullName: string;
   provider: string;
};

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | any>;

export type { AsyncHandler, AuthRequestInfo };
