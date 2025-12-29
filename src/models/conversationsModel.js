const pool = require("../config/db");

exports.checkExistingConversationById = async (id) => {
  //
  const result = await pool.query(
    "SELECT id FROM conversations WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

// Insert Conversation for Individual.
exports.InsertConversation = async (type, name, created_by) => {
  const query = `
    INSERT INTO conversations (type, name, created_by)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await pool.query(query, [type, name, created_by]);
  return result.rows[0]; // This will now contain the inserted row
};

// Insert Conversation Member for Individual
exports.InsertConversationMembers = async (conversation_id, user_id, role) => {
  //
  const query =
    "INSERT INTO conversation_members (conversation_id, user_id, role) VALUES ($1, $2, $3) RETURNING *";
  const result = await pool.query(query, [conversation_id, user_id, role]);
  return result.rows[0];
};

// Used only for Individual

exports.checkExistingConversationIndividual = async (
  loggedInUserId,
  chatUserId
) => {
  //
  const query = `

    SELECT c.id
    FROM conversations c
    JOIN conversation_members m1 ON c.id = m1.conversation_id
    JOIN conversation_members m2 ON c.id = m2.conversation_id
    WHERE c.type = 'individual'
      AND m1.user_id = $1
      AND m2.user_id = $2
    LIMIT 1;
  `;

  try {
    const { rows } = await pool.query(query, [loggedInUserId, chatUserId]);
    if (rows.length > 0) {
      return rows[0]; // ✅ Return conversation object if exists
    }
    return null; // No existing conversation found
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

exports.getExistingConversationIndividual = async (
  loggedInUserId,
  chatUserId
) => {
  const query = `
    SELECT c.id
    FROM conversations c
    JOIN conversation_members m1 ON c.id = m1.conversation_id
    JOIN conversation_members m2 ON c.id = m2.conversation_id
    WHERE c.type = 'individual'
      AND m1.user_id = $1
      AND m2.user_id = $2
    LIMIT 1;
  `;

  try {
    const { rows } = await pool.query(query, [loggedInUserId, chatUserId]);
    if (rows.length > 0) {
      return rows[0]; // ✅ Return conversation ID if exists
    }
    return null; // No existing conversation found
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

exports.checkExistingConvoWithIndivv2 = async (loggedInUserId, chatUserId) => {
  //
  // Justine
  const checkLoggedInUserId = await pool.query(
    "SELECT id FROM conversation_members WHERE user_id = $1",
    [loggedInUserId]
  );

  // Ian
  const checkChatUserId = await pool.query(
    "SELECT id FROM conversation_members WHERE user_id = $1",
    [chatUserId]
  );

  if (
    checkLoggedInUserId.rows[0].length === 0 &&
    checkChatUserId.rows[0].length
  ) {
    return true;
  }

  return false;
  // return result.rows[0];
};

exports.getConversationSidebarQuery = async (
  conversationId,
  loggedInUserId
) => {
  const query = `
    SELECT 
      m.id AS message_id,
      m.content,
      m.message_type,
      m.created_at,
      m.updated_at,
      m.deleted,
      u.id AS sender_id,
      u.username AS sender_username,
      u.display_name AS sender_display_name,
      u.profile_image_url AS sender_profile_image
      
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    JOIN conversations c ON m.conversation_id = c.id
    
    WHERE c.id = $1
      AND c.type = 'individual'
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

exports.checkRecentSearchHasConvo = async (otherUserId, userId) => {
  // const query = `
  //   SELECT
  //     c.id as conversation_id,
  //     c.type,
  //     c.name
  //   FROM conversations c
  //   INNER JOIN conversation_members cm ON cm.conversation_id = c.id
  //   WHERE c.type = 'individual'
  //     AND cm.user_id IN ($1, $2)
  //   GROUP BY c.id, c.type, c.name
  //   HAVING COUNT(DISTINCT cm.user_id) = 2
  //   LIMIT 1
  // `;

  // Join approach.

  const query = `
    SELECT
      c.id as conversation_id,
      c.type,
      c.name
    FROM conversations c
    INNER JOIN conversation_members cm1 ON cm1.conversation_id = c.id
    INNER JOIN conversation_members cm2 ON cm2.conversation_id = c.id
    WHERE c.type = 'individual'
      AND cm1.user_id = $1
      AND cm2.user_id = $2
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [userId, otherUserId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error checking conversation:", error);
    throw error;
  }
};
