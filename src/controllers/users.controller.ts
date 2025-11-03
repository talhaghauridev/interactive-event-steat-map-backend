import { NextFunction, Request, Response } from "express";
import { LRUCache } from "../cache/LRUCache";
import { RequestQueue } from "../queue/requestQueue";
import { User } from "../types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { mockDatabase } from "../utils/mockDatabase";
import { PerformanceTracker } from "../utils/performanceTracker";

const userCache = new LRUCache<User>(100, 60);
const requestQueue = new RequestQueue();
const performanceTracker = new PerformanceTracker();

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
   const startTime = Date.now();

   try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId) || userId <= 0) {
         return ApiError.badRequest(next, "Invalid user ID. Must be a positive number");
      }

      const cachedUser = userCache.get(userId.toString());

      if (cachedUser) {
         const responseTime = Date.now() - startTime;
         performanceTracker.recordResponseTime(responseTime);

         console.log(`[Cache HIT] User ${userId} - Response time: ${responseTime}ms`);

         return ApiResponse.success(
            res,
            {
               user: cachedUser,
               cached: true,
               responseTime: `${responseTime}ms`
            },
            "User fetched successfully"
         );
      }

      console.log(`[Cache MISS] User ${userId} - Fetching from database`);

      try {
         const user = await requestQueue.fetchUser(userId);

         // Cache the result
         userCache.set(userId.toString(), user);

         const responseTime = Date.now() - startTime;
         performanceTracker.recordResponseTime(responseTime);

         console.log(`[Database] User ${userId} fetched - Response time: ${responseTime}ms`);

         return ApiResponse.success(
            res,
            {
               user,
               cached: false,
               responseTime: `${responseTime}ms`
            },
            "User fetched successfully"
         );
      } catch (error) {
         return ApiError.notFound(next, "User not found");
      }
   } catch (error) {
      console.error("[Error] getUserById:", error);
      return ApiError.internalError(next);
   }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { name, email } = req.body;

      if (!name || !email) {
         return ApiError.badRequest(next, "Name and email are required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         return ApiError.badRequest(next, "Invalid email format");
      }

      const newUser = mockDatabase.createUser(name, email);

      userCache.set(newUser.id.toString(), newUser);

      console.log(`[Create] New user created with ID ${newUser.id}`);

      return ApiResponse.created(
         res,
         {
            user: newUser
         },
         "User created successfully"
      );
   } catch (error) {
      console.error("[Error] createUser:", error);
      return ApiError.internalError(next);
   }
};

export const getCacheStatus = (req: Request, res: Response, next: NextFunction) => {
   try {
      const cacheStats = userCache.getStats();
      const queueStats = requestQueue.getStats();
      const perfMetrics = performanceTracker.getMetrics();

      return ApiResponse.success(
         res,
         {
            cache: cacheStats,
            queue: queueStats,
            performance: perfMetrics
         },
         "Cache status fetched successfully"
      );
   } catch (error) {
      console.error("[Error] getCacheStatus:", error);
      return ApiError.internalError(next);
   }
};

export const clearCache = (req: Request, res: Response, next: NextFunction) => {
   try {
      userCache.clear();

      console.log("[Cache] Cache cleared manually");

      return ApiResponse.success(
         res,
         {
            cleared: true
         },
         "Cache cleared successfully"
      );
   } catch (error) {
      console.error("[Error] clearCache:", error);
      return ApiError.internalError(next);
   }
};

export { userCache };
