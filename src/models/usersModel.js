const pool = require("../config/db");

// Register User
exports.insertUserAccount = async (
  username,
  email,
  password_hash,
  display_name
) => {
  //
  const query =
    "INSERT INTO users (username, email, password_hash, display_name) VALUES ($1, $2, $3, $4) RETURNING *";

  const result = await pool.query(query, [
    username,
    email,
    password_hash,
    display_name,
  ]);
  return result.rows[0];
};

//
exports.checkExistingUser = async (username, email) => {
  //
  const result = await pool.query(
    "SELECT * FROM users WHERE username = $1 OR email = $2",
    [username, email]
  );
  return result;
};

exports.checkExistingUserByEmail = async (email) => {
  //
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result;
};

exports.checkExistingUserById = async (id) => {
  //
  const result = await pool.query(
    "SELECT id, username, email, display_name FROM users WHERE id = $1",
    [id]
  );
  return result;
};

exports.getAllUsers = async (searchQuery) => {
  //
  const result = await pool.query(
    "SELECT id, username, email, display_name FROM users WHERE display_name = $1",
    [searchQuery]
  );
  return result;
};

exports.getUsersSearch = async (searchQuery) => {
  const trimmed = searchQuery?.trim() || "";
  const terms = trimmed.split(/\s+/).filter(Boolean);

  // ✅ If user search is empty, return all users or empty array depending on design
  if (terms.length === 0) {
    //
    // Option 1: return all users (like Facebook’s default user list)
    const allUsers = await pool.query(
      `SELECT id, username, email, display_name FROM users ORDER BY display_name LIMIT 5`
    );
    return allUsers.rows;

    // Option 2: if you prefer to return no results instead:
    // return [];
  }

  // Continue normal search logic
  const conditions = terms.map(
    (_, i) => `display_name ILIKE '%' || $${i + 1} || '%'`
  );

  const query = `
    SELECT id, username, email, display_name
    FROM users
    WHERE ${conditions.join(" AND ")}
    ORDER BY display_name
  `;

  const result = await pool.query(query, terms);
  return result.rows || [];
};

exports.checkUserExists = async (userId) => {
  const query = `SELECT id FROM users WHERE id = $1`;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking user exists:", error);
    throw error;
  }
};
