const pool = require("../config/db");

// Insert Conversation Member for Individual
exports.InsertMessageIndividual = async (
  conversation_id,
  sender_id,
  content,
  replyToMessageId = null
) => {
  // const query =
  //   "INSERT INTO messages (conversation_id, sender_id, content, reply_to_message_id) VALUES ($1, $2, $3, $4) RETURNING *";
  // const result = await pool.query(query, [
  //   conversation_id,
  //   sender_id,
  //   content,
  //   replyToMessageId,
  // ]);
  // return result.rows[0];

  try {
    const query =
      "INSERT INTO messages (conversation_id, sender_id, content, reply_to_message_id) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(query, [
      conversation_id,
      sender_id,
      content,
      replyToMessageId,
    ]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
};

exports.checkMessageConversation = async (messageId, loggedInUserId) => {
  const query = `
    SELECT *
    FROM messages c
    WHERE c.id = $1
    AND c.sender_id = $2
  `;

  try {
    const { rows } = await pool.query(query, [
      parseInt(messageId),
      loggedInUserId,
    ]);
    if (rows.length > 0) {
      return rows[0]; // ✅ Return conversation if exists
    }
    return null; // No existing conversation found
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

exports.updateMessage = async (messageId, newContent) => {
  const query = `
    UPDATE messages
    SET content = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [newContent, messageId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

exports.deleteMessage = async (messageId, senderId) => {
  const query = `
    UPDATE messages
    SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND sender_id = $2
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [messageId, senderId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

// Individual.
exports.getConversationMessagesWithUser = async (
  conversationId,
  loggedInUserId
) => {
  const query = `
    SELECT 
      m.id AS id,
      m.reply_to_message_id,
      m.content,
      m.message_type,
      m.created_at,
      m.updated_at,
      m.deleted,
      u.id AS sender_id,
      u.username AS sender_username,
      u.display_name AS sender_display_name,
      u.profile_image_url AS sender_profile_image,


    -- Reply message content (self join)
    rm.content AS reply_message_content,
    rm.sender_id AS reply_message_sender_id

      
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    JOIN conversations c ON m.conversation_id = c.id
    
    LEFT JOIN messages rm ON rm.id = m.reply_to_message_id

    WHERE c.id = $1
      AND c.type = 'individual'
      AND m.deleted = false
    ORDER BY m.created_at ASC;
  `;

  try {
    const { rows } = await pool.query(query, [conversationId]);
    return rows; // return all messages in that conversation
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

exports.getUserChatList = async (loggedInUserId) => {
  const query = `
    SELECT 
      c.id AS conversation_id,
      c.type,
      c.name AS group_name,
      m.id AS last_message_id,
      m.content AS last_message,
      m.created_at AS last_message_time,
      u.id AS chat_user_id,
      u.username AS chat_username,
      u.display_name AS chat_display_name,
      u.profile_image_url AS chat_profile_image

      
    FROM conversations c

    JOIN conversation_members cm1 ON cm1.conversation_id = c.id

    LEFT JOIN messages m ON m.id = (
        SELECT id FROM messages 
        WHERE conversation_id = c.id 
        AND deleted = false
        ORDER BY created_at DESC 
        LIMIT 1
    )

    LEFT JOIN conversation_members cm2 
      ON cm2.conversation_id = c.id 
      AND cm2.user_id != cm1.user_id

    LEFT JOIN users u ON u.id = cm2.user_id
    WHERE cm1.user_id = $1
    ORDER BY m.created_at DESC NULLS LAST;

  `;

  try {
    const { rows } = await pool.query(query, [loggedInUserId]);
    return rows || null;
  } catch (error) {
    console.error("Error fetching user chat list:", error);
    throw error;
  }
};

exports.getUserChatListv2 = async (conversationId, loggedInUserId) => {
  const query = `
    SELECT 

    FROM conversation_members as t1

    JOIN users t2 ON t2.id = t1.user_id

    JOIN conversations t3 ON t3.id = t1.conversation_id

    JOIN messages t4 ON t4.conversation_id = t3.id
    
    WHERE t1.conversation_id = $1
      AND t1.user_id = $2
    
    ORDER BY m.created_at ASC;
  `;

  try {
    const { rows } = await pool.query(query, [conversationId, loggedInUserId]);
    return rows; // return all messages in that conversation
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

exports.searchMessagesv2 = async (messageText, loggedInUserId) => {
  const query = `
    SELECT m.*
    FROM messages m

    JOIN conversation_members cm
      ON cm.conversation_id = m.conversation_id
      
    WHERE m.content ILIKE '%' || $1 || '%'
      AND cm.user_id = $2
      AND m.deleted = FALSE
    ORDER BY m.created_at DESC
    LIMIT 50;
  `;

  try {
    const { rows } = await pool.query(query, [messageText, loggedInUserId]);
    return rows; // Return all matching messages
  } catch (error) {
    console.error("Error searching messages:", error);
    throw error;
  }
};

exports.searchMessagesv2 = async (
  messageText,
  loggedInUserId,
  conversationId
) => {
  // Split search text into words and filter out empty strings
  const words = messageText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return []; // Return empty if no valid search terms
  }

  // Build ILIKE conditions for each word
  const conditions = words
    .map((_, index) => `m.content ILIKE $${index + 1}`)
    .join(" OR ");

  const query = `
    SELECT m.* 
    FROM messages m
    JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    AND cm.conversation_id = conversationId

    WHERE (${conditions})
      AND cm.user_id = $${words.length + 1}
      AND m.deleted = FALSE
    ORDER BY m.created_at DESC
    LIMIT 50
  `;

  try {
    // Wrap each word with wildcards for partial matching
    const params = [...words.map((word) => `%${word}%`), loggedInUserId];
    const { rows } = await pool.query(query, params, conversationId);
    return rows;
  } catch (error) {
    console.error("Error searching messages:", error);
    throw error;
  }
};
exports.searchMessages = async (
  messageText,
  loggedInUserId,
  conversationId
) => {
  // Split search text into words and filter out empty strings
  const words = messageText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return []; // Return empty if no valid search terms
  }

  // Build ILIKE conditions for each word
  const conditions = words
    .map((_, index) => `m.content ILIKE $${index + 1}`)
    .join(" OR ");

  const query = `
    SELECT m.* 
    FROM messages m
    JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE (${conditions})
      AND cm.user_id = $${words.length + 1}
      AND m.conversation_id = $${words.length + 2}
      AND m.deleted = FALSE
    ORDER BY m.created_at DESC
    LIMIT 50
  `;

  try {
    // Wrap each word with wildcards for partial matching
    const params = [
      ...words.map((word) => `%${word}%`),
      loggedInUserId,
      conversationId,
    ];
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error("Error searching messages:", error);
    throw error;
  }
};

exports.sendMessageNoConvoQuery = async (
  senderId,
  receiverId,
  content,
  messageType = "text",
  replyToMessageId = null
) => {
  const client = await pool.connect(); // Get a client from the pool

  try {
    await client.query("BEGIN"); // Start transaction

    // Step 1: Check if conversation exists between the two users
    const checkConvoQuery = `
      SELECT c.id as conversation_id
      FROM conversations c
      INNER JOIN conversation_members cm1 ON cm1.conversation_id = c.id
      INNER JOIN conversation_members cm2 ON cm2.conversation_id = c.id
      WHERE c.type = 'individual'
        AND cm1.user_id = $1
        AND cm2.user_id = $2
      LIMIT 1
    `;

    const convoResult = await client.query(checkConvoQuery, [
      senderId,
      receiverId,
    ]);

    let conversationId;

    // Step 2: If no conversation exists, create one
    if (convoResult.rows.length === 0) {
      // Create new conversation
      const createConvoQuery = `
        INSERT INTO conversations (type, created_by)
        VALUES ('individual', $1)
        RETURNING id
      `;

      const newConvo = await client.query(createConvoQuery, [senderId]);
      conversationId = newConvo.rows[0].id;

      // Add both users as members
      const addMembersQuery = `
        INSERT INTO conversation_members (conversation_id, user_id)
        VALUES 
          ($1, $2),
          ($1, $3)
      `;

      await client.query(addMembersQuery, [
        conversationId,
        senderId,
        receiverId,
      ]);
    } else {
      // Use existing conversation
      conversationId = convoResult.rows[0].conversation_id;
    }

    // Step 3: Insert the message
    const insertMessageQuery = `
      INSERT INTO messages (conversation_id, sender_id, content, message_type, reply_to_message_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const messageResult = await client.query(insertMessageQuery, [
      conversationId,
      senderId,
      content,
      messageType,
      replyToMessageId, // Added the missing parameter
    ]);

    await client.query("COMMIT"); // Commit transaction

    return {
      message: messageResult.rows[0],
      conversationId: conversationId,
      isNewConversation: convoResult.rows.length === 0,
    };
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback on error
    console.error("Error sending message:", error);
    throw error;
  } finally {
    client.release(); // Release the client back to the pool
  }
};
