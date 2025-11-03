import { z } from "zod";
import "dotenv-flow/config";

const envSchema = z.object({
   NODE_ENV: z.enum(["development", "production"]).default("development"),
   PORT: z.coerce.number().default(4001),
   FRONTEND_URLS: z.string().default("http://localhost:3000"),
   ACCESS_TOKEN_SECRET: z.string().nonempty(),
   ACCESS_TOKEN_EXPIRE: z.string().default("30d"),
   REFRESH_TOKEN_SECRET: z.string().nonempty(),
   REFRESH_TOKEN_EXPIRE: z.string().default("30d")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
   console.log("Environment variables validation failed: ", parsedEnv.error.issues);
   throw new Error("There is an error with the environment variables. ");
}

export const env = parsedEnv.data;

export type ENV = z.infer<typeof envSchema>;

declare global {
   namespace NodeJS {
      interface ProcessEnv extends ENV {}
   }
}
