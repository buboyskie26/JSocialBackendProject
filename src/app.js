const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
//
const usersRoute = require("./route/usersRoutes");
const conversationsRoute = require("./route/coversationsRoutes");
const messagesRoute = require("./route/messagesRoutes");
const recentSearchesRoute = require("./route/recentSearchesRoutes");

// app.use(express.json());
// app.use(cookieParser()); // Otherwise, req.cookies will be undefined.

// app.use(cors()); // allows all origins

// app.use(
//   cors({
//     origin: "http://localhost:5173", // Your React app's URL
//     credentials: true, // Allow cookies and auth headers
//   })
// );

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// 1. CORS Configuration (MUST BE FIRST)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://jsocial-frontend-vercel.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
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

// 2. Handle preflight
app.options("*", cors());

app.use(express.json());
app.use(cookieParser()); // Otherwise, req.cookies will be undefined.
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", usersRoute);
app.use("/api/conversations", conversationsRoute);
app.use("/api/messages", messagesRoute);
app.use("/api/recentSearches", recentSearchesRoute);

module.exports = app;
