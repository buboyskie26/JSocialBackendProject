const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Initialize Express app
const app = express();

// Routes
const usersRoute = require("./route/usersRoutes");
const conversationsRoute = require("./route/conversationsRoutes");
const messagesRoute = require("./route/messagesRoutes");
const recentSearchesRoute = require("./route/recentSearchesRoutes");

// Middleware
app.use(express.json());
app.use(cookieParser()); // Otherwise, req.cookies will be undefined.

// CORS configuration
const allowedOrigins = [
  "https://jsocial-frontend-vercel.vercel.app",
  "https://jsocialbackendproject-deployment.onrender.com",
  "http://localhost:5173",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Add this BEFORE the 404 handler
app.get("/socket.io-test", (req, res) => {
  const io = req.app.get("io");
  res.json({
    socketIO: io ? "initialized" : "not initialized",
    message: "Socket.IO server status",
  });
});

// Health check route (update this)
app.get("/health", (req, res) => {
  const io = req.app.get("io");
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    socketIO: io ? "ready" : "not initialized",
  });
});
// API Routes
app.use("/api/auth", usersRoute);
app.use("/api/conversations", conversationsRoute);
app.use("/api/messages", messagesRoute);
app.use("/api/recentSearches", recentSearchesRoute);

// 404 handler (optional)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Export app (without listening - that happens in server.js)
module.exports = app;
