const pool = require("../config/db");

exports.addRecentSearch = async (loggedInUserId, searchedUserId) => {
  try {
    // Adds a new entry if it doesn’t exist
    // Updates timestamp if already exists (so it “bumps” to the top again)
    //
    const query = `
    INSERT INTO recent_searches (user_id, searched_user_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, searched_user_id)
    DO UPDATE SET 
      searched_at = NOW(),
      deleted = false
    RETURNING *;
  `;

    const { rows } = await pool.query(query, [loggedInUserId, searchedUserId]);

    if (rows.length > 0) {
      return rows[0]; // ✅
    }
    return null; // No existing   found
  } catch (error) {
    console.error("Error adding conversation:", error);
    throw error;
  }
};

exports.getRecentSearches = async (userId) => {
  const query = `
    SELECT 
      u.id, u.display_name, u.username, u.email
    FROM recent_searches rs
    JOIN users u ON rs.searched_user_id = u.id
    WHERE rs.user_id = $1
    AND rs.deleted = false
    ORDER BY rs.searched_at DESC
    LIMIT 5
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows || null;
  } catch (error) {
    console.log(error);
  }
};


exports.deleteRecentSearch = async (loggedInUserId, searchedUserId) => {
  try {
    // 1️⃣ Validate searched user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      searchedUserId,
    ]);

    if (userCheck.rowCount === 0) {
      // searched user doesn't exist
      throw new Error("Searched user does not exist");
    }

    // 2️⃣ Proceed with soft delete
    const query = `
      UPDATE recent_searches
      SET deleted = TRUE
      WHERE user_id = $1 AND searched_user_id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [loggedInUserId, searchedUserId]);

    // 3️⃣ Validate if recent search record exists
    if (result.rowCount === 0) {
      throw new Error("Recent search not found for this user");
    }

    // 4️⃣ Return deleted record
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error in deleteRecentSearch:", error.message);
    throw error;
  }
};

exports.deleteRecentSearchv2 = async (userId, searchedUserId) => {
  await pool.query(
    `DELETE FROM recent_searches WHERE user_id = $1 AND searched_user_id = $2`,
    [userId, searchedUserId]
  );
};
