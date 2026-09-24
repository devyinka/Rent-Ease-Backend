import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { ZodError, z } from "zod";
import { AppError } from "./errors/appError.js";

import { requireAuth } from "./auth/auth.MiddleWare.js";

import authRoutes from "./auth/auth.Routes.js";
import propertyRoutes from "./routes/property.route.js";
import unitRoutes from "./routes/unit.route.js";
import tenantRoutes from "./routes/tenant.route.js";
import tenancyRoutes from "./routes/tenancy.route.js";
import tenantInvitation from "./routes/tenantInvitation.route.js";
import agentRoute from "./routes/agent.route.js";
import agentInvitationRoute from "./routes/agentInvitation.route.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (React Native, Postman, server-to-server).
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(
  compression({
    threshold: 1024,
  }),
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  }),
);

app.use(cookieParser());

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  skip: (req) => {
    return req.path === "/health";
  },
});

app.use(globalRateLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "RentEase API is running",
  });
});

app.use("/", authRoutes);

app.use(requireAuth);

app.get("/api/me", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      userId: req.user?.id,
      sessionId: req.user?.sessionId,
      role: req.user?.role,
    },
  });
});

app.use("/", propertyRoutes);
app.use("/", unitRoutes);
app.use("/", tenantRoutes);
app.use("/", tenancyRoutes);
app.use("/", tenantInvitation);
app.use("/", agentRoute);
app.use("/", agentInvitationRoute);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);

    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    if (err.message === "Not allowed by CORS") {
      return res.status(403).json({
        success: false,
        message: "Origin not allowed",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  },
);
export default app;
