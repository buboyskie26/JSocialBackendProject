// For Local Postgres Development.

// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT,
// });

// pool
//   .connect()
//   .then(() => console.log("✅ Connected to PostgreSQL"))
//   .catch((err) => console.error("❌ DB Connection Error:", err));

// module.exports = pool;

// For Supabase Postgres Development.
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

//// Alternative.
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

module.exports = pool;
