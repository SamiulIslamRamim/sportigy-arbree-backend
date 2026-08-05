import express from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes/index.js";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { AppError } from "./utils/AppError.js";
import { ERROR_CODES } from "./constants/errorCodes.js";
import { errorHandler } from "./utils/errorHandler.js";


const app = express();
const PORT = process.env.PORT ?? 8000;

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL!, "http://localhost:3000"],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use("/", router);

// ─── 404 Handler (routed through AppError for envelope consistency) ─────────────
app.use((_req, _res, next) => {
  next(new AppError(ERROR_CODES.NOT_FOUND));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});