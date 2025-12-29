const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Import routes
const usersRoute = require("./route/usersRoutes");
const conversationsRoute = require("./route/coversationsRoutes");
const messagesRoute = require("./route/messagesRoutes");
const recentSearchesRoute = require("./route/recentSearchesRoutes");

// 1. CORS Configuration (MUST BE FIRST, BEFORE OTHER MIDDLEWARE)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://jsocial-frontend-vercel.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 2. Handle preflight requests for all routes
app.options("*", cors());

// 3. Body parsers and cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Request logging (optional but helpful for debugging)
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.path} - Origin: ${req.headers.origin || "No origin"}`
  );
  next();
});

// 5. Health check endpoint (helpful for monitoring)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 6. Routes
app.use("/api/auth", usersRoute);
app.use("/api/conversations", conversationsRoute);
app.use("/api/messages", messagesRoute);
app.use("/api/recentSearches", recentSearchesRoute);

// 7. 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// 8. Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    path: req.path,
  });
});

module.exports = app;
