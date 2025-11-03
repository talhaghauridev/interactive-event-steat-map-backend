import { NextFunction, Request, Response } from "express";
import { LRUCache } from "../cache/LRUCache";
import { RequestQueue } from "../queue/requestQueue";
import { User } from "../types";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { createLogger } from "../utils/logger";
import { mockDatabase } from "../utils/mockDatabase";
import { PerformanceTracker } from "../utils/performanceTracker";

const logger = createLogger("users");

const userCache = new LRUCache<User>(100, 60);
const requestQueue = new RequestQueue();
const performanceTracker = new PerformanceTracker();

export const getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

         logger.info({ userId, responseTime, cached: true }, `Cache HIT: User ${userId}`);

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

      logger.info({ userId }, `Cache MISS: User ${userId} - Fetching from database`);

      try {
         const user = await requestQueue.fetchUser(userId);

         userCache.set(userId.toString(), user);

         const responseTime = Date.now() - startTime;
         performanceTracker.recordResponseTime(responseTime);

         logger.info({ userId, responseTime, cached: false }, `Database fetch complete: User ${userId}`);

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
      logger.error({ error }, "Error in getUserById");
      return ApiError.internalError(next);
   }
});

export const createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

      logger.info({ userId: newUser.id, name: newUser.name }, `New user created: ${newUser.id}`);

      return ApiResponse.created(
         res,
         {
            user: newUser
         },
         "User created successfully"
      );
   } catch (error) {
      logger.error({ error }, "Error in createUser");
      return ApiError.internalError(next);
   }
});

export const getCacheStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
      logger.error({ error }, "Error in getCacheStatus");
      return ApiError.internalError(next);
   }
});

export const clearCache = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
   try {
      userCache.clear();

      logger.info("Cache cleared manually");

      return ApiResponse.success(
         res,
         {
            cleared: true
         },
         "Cache cleared successfully"
      );
   } catch (error) {
      logger.error({ error }, "Error in clearCache");
      return ApiError.internalError(next);
   }
});

export { userCache };
