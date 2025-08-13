const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    require: true
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Fallback to DATABASE_URL if individual params not available (Render style)
if (process.env.DATABASE_URL && !process.env.DB_HOST) {
  dbConfig.connectionString = process.env.DATABASE_URL;
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

const db = new Pool(dbConfig);

module.exports = db;
