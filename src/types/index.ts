/**
 * TypeScript types and interfaces
 */

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
