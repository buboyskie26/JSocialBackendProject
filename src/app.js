const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
//
const usersRoute = require("./route/usersRoutes");
const conversationsRoute = require("./route/coversationsRoutes");
const messagesRoute = require("./route/messagesRoutes");
const recentSearchesRoute = require("./route/recentSearchesRoutes");

app.use(express.json());
app.use(cookieParser()); // Otherwise, req.cookies will be undefined.
// app.use(cors()); // allows all origins

app.use(
  cors({
    origin: "http://localhost:5173", // Your React app's URL
    credentials: true, // Allow cookies and auth headers
  })
);

app.use("/api/auth", usersRoute);
app.use("/api/conversations", conversationsRoute);
app.use("/api/messages", messagesRoute);
app.use("/api/recentSearches", recentSearchesRoute);

module.exports = app;
