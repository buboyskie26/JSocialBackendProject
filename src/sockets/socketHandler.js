const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // Adjust path to your DB config

module.exports = (io, app) => {
  //
  const userSockets = app.get("userSockets");

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });
  //
  io.on("connection", async (socket) => {
    //
    const userId = socket.userId;

    // Track user's socket connections
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }

    userSockets.get(userId).add(socket.id);

    // Join user to their personal room
    // socket.join(`user:${userId}`);

    // Broadcast user is online (only if first connection)
    if (userSockets.get(userId).size === 1) {
      socket.broadcast.emit("user:online", { userId });
      console.log(`🟢 User ${userId} is now ONLINE. Socket: ${socket?.id}`);
    }

    // Join all user's conversations
    // socket.on("conversationsv2:join", async () => {
    //   try {
    //     const result = await pool.query(
    //       `SELECT conversation_id FROM conversation_members WHERE user_id = $1`,
    //       [userId]
    //     );

    //     result.rows.forEach((row) => {
    //       socket.join(`conversation:${row.conversation_id}`);
    //     });

    //     socket.emit("conversations:joined", {
    //       count: result.rows.length,
    //     });

    //     console.log(
    //       `📥 User ${userId} joined ${result.rows.length} conversations`
    //     );
    //   } catch (error) {
    //     console.error("Error joining conversations:", error);
    //     socket.emit("error", { message: "Failed to join conversations" });
    //   }
    // });

    // ✅ AUTOMATICALLY join user to their conversations on connect
    try {
      const result = await pool.query(
        `SELECT conversation_id FROM conversation_members WHERE user_id = $1`,
        [userId],
      );

      const conversationIds = result.rows.map((row) => row.conversation_id);

      // User joined in the conversations
      conversationIds.forEach((convId) => {
        socket.join(`conversation:${convId}`);
      });

      // Also join a personal room for direct notifications
      socket.join(`user:${userId}`);

      console.log(
        `📥 User ${userId} auto-joined ${conversationIds.length} conversations`,
      );

      // Optional: Notify client of successful join
      // socket.emit("conversations:joined", {
      //   count: conversationIds.length,
      //   conversationIds: conversationIds,
      // });
      //
    } catch (error) {
      console.error(
        `❌ Error auto-joining conversations for user ${userId}:`,
        error,
      );
    }

    // Typing indicators
    //
    try {
      const result = await pool.query(
        `SELECT display_name,username,email FROM users WHERE id = $1`,
        [userId],
      );

      const rowResult = result.rows[0];
      //
      // Listen to the Emitted of typing:start coming in the backend. useTypingIndicator.ts
      socket.on("typing:start", ({ conversationId }) => {
        // typing:start
        socket.to(`conversation:${conversationId}`).emit("typing:start", {
          userId,
          username: rowResult?.username,
          display_name: rowResult?.display_name,
          email: rowResult?.email,
          conversationId,
        });
        console.log({ rowResult: rowResult?.username });
      });
      //
      socket.on("typing:stop", ({ conversationId }) => {
        socket.to(`conversation:${conversationId}`).emit("typing:stop", {
          userId,
          username: rowResult?.username,
          display_name: rowResult?.display_name,
          email: rowResult?.email,
          conversationId,
        });
        console.log("typing is ended..");
      });
      //
    } catch (error) {
      console.error(`❌ Error code: `, error);
    }

    // ✅ Manual join (for when user opens/creates a new conversation)
    socket.on("conversation:join", async ({ conversationId }) => {
      try {
        // Verify user is a member of this conversation
        const isMember = await pool.query(
          `SELECT 1 FROM conversation_members 
           WHERE conversation_id = $1 AND user_id = $2`,
          [conversationId, userId],
        );

        if (isMember.rows.length === 0) {
          socket.emit("error", {
            message: "You are not a member of this conversation",
          });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`📥 User ${userId} joined conversation:${conversationId}`);

        socket.emit("conversation:joined", { conversationId });
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", {
          message: "Failed to join conversation",
        });
      }
    });

    // Message read receipts
    socket.on("message:read", async ({ messageId, conversationId }) => {
      try {
        await pool.query(
          `UPDATE messages SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [messageId],
        );

        socket.to(`conversation:${conversationId}`).emit("message:read", {
          messageId,
          userId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);

        // If user has no more connections, mark offline
        if (sockets.size === 0) {
          userSockets.delete(userId);
          io.emit("user:offline", { userId });
          console.log(`❌ User ${userId} fully disconnected`);
        } else {
          console.log(
            `🔌 User ${userId} disconnected one device (${sockets.size} remaining)`,
          );
        }
      }
    });
    //
  });
  //
};
