import { User } from "../types";
import { mockDatabase } from "../utils/mockDatabase";

export class RequestQueue {
   private pendingRequests: Map<number, Promise<User>>;
   private totalRequests: number = 0;
   private deduplicatedRequests: number = 0;

   constructor() {
      this.pendingRequests = new Map();
   }

   async fetchUser(userId: number): Promise<User> {
      this.totalRequests++;

      const pending = this.pendingRequests.get(userId);
      if (pending) {
         this.deduplicatedRequests++;
         console.log(`[Queue] Request for user ${userId} deduplicated (waiting for existing fetch)`);
         return pending;
      }

      const promise = this.executeUserFetch(userId);
      this.pendingRequests.set(userId, promise);

      try {
         const user = await promise;
         return user;
      } finally {
         this.pendingRequests.delete(userId);
      }
   }

   private async executeUserFetch(userId: number): Promise<User> {
      console.log(`[Queue] Fetching user ${userId} from database...`);

      await this.delay(200);

      const user = mockDatabase.getUser(userId);

      if (!user) {
         throw new Error(`User with ID ${userId} not found`);
      }

      console.log(`[Queue] User ${userId} fetched successfully`);
      return user;
   }

   getStats() {
      return {
         totalRequests: this.totalRequests,
         deduplicatedRequests: this.deduplicatedRequests,
         currentPendingRequests: this.pendingRequests.size,
         deduplicationRate: this.totalRequests > 0 ? ((this.deduplicatedRequests / this.totalRequests) * 100).toFixed(2) + "%" : "0%"
      };
   }

   private delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
   }

   resetStats(): void {
      this.totalRequests = 0;
      this.deduplicatedRequests = 0;
   }
}
