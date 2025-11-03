import compression, { CompressionOptions } from "compression";
import { env } from "../env";
import { CorsOptions } from "cors";
import { HelmetOptions } from "helmet";

const cors: CorsOptions = {
   origin: [env.NODE_ENV === "development" ? "*" : env.FRONTEND_URLS],
   credentials: true,
   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
   allowedHeaders: ["Content-Type", "Authorization", "Accept"]
};
const helmet: HelmetOptions = {
   contentSecurityPolicy: env.NODE_ENV !== "development",
   crossOriginEmbedderPolicy: env.NODE_ENV !== "development"
};

const _compression: CompressionOptions = {
   level: 6,
   threshold: "2kb",
   filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
         return false;
      }
      return compression.filter(req, res);
   }
};
export const config = {
   cors,
   helmet,
   compression: _compression
};
