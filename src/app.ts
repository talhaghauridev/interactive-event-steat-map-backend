import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/app.config";
import errorMiddleware from "./middleware/error.middleware";
import routes from "./routes/routes";
import ApiResponse from "./utils/ApiResponse";
import ApiError from "./utils/ApiError";
import { HTTP_STATUS } from "./utils/httpStatus";
import favicon from "serve-favicon";
import path from "path";
import { fileURLToPath } from "url";
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const payloadLimit = "50mb";
app.use(favicon(path.join(__dirname, "..", "public", "favicon.jpg")));
app.use(helmet(config.helmet));

app.use(express.json({ limit: payloadLimit }));
app.use(
   express.urlencoded({
      extended: true,
      limit: payloadLimit
   })
);

app.use(compression(config.compression));
app.use(cors(config.cors));
app.use(morgan("dev"));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
   if (err.status === 413 || err.code === "LIMIT_FILE_SIZE" || err.type === "entity.too.large") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
         success: false,
         statusCode: HTTP_STATUS.BAD_REQUEST,
         message: "File too large. Maximum size allowed is 50MB"
      });
   }
   next(err);
});

app.use("/api/v1", routes);

app.get("/", (req, res) => {
   console.log(req.headers["user-agent"]);
   return ApiResponse.success(
      res,
      {
         message: "Server is running",
         version: "1.0.0"
      },
      "Server is healthy"
   );
});

app.use("*", (req, res, next) => {
   return ApiError.notFound(next, `Route ${req.originalUrl} not found`);
});

app.use(errorMiddleware);

export default app;
