// require("dotenv").config();
// const app = require("./src/app");

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
//   console.log(
//     `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
//   );
// });

require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require("./src/sockets/socketHandler");

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize Socket.io
const allowedOrigins = [
  "https://jsocial-frontend-vercel.vercel.app",
  "https://jsocialbackendproject-deployment.onrender.com",
  "http://localhost:5173",
  "http://localhost:4173",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  // Add these options for better compatibility with Render
  transports: ["websocket", "polling"], // Fallback to polling if WebSocket fails
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible throughout the app
app.set("io", io);
app.set("userSockets", new Map()); // Track user connections

// Initialize socket handlers
socketHandler(io, app);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
  );
  console.log(`🔌 Socket.io initialized`);
});
