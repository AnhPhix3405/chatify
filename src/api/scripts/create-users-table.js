require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');

const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
});

async function createUsersTable() {
  try {
    const client = await db.connect();

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        avatar TEXT,
        status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Users table created successfully');

    // Insert sample data
    await client.query(`
      INSERT INTO users (name, email, avatar, status, last_seen) VALUES
      ('Alice Johnson', 'alice@example.com', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150', 'online', CURRENT_TIMESTAMP),
      ('Bob Smith', 'bob@example.com', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150', 'offline', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
      ('Emma Wilson', 'emma@example.com', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150', 'typing', CURRENT_TIMESTAMP),
      ('David Chen', 'david@example.com', 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150', 'online', CURRENT_TIMESTAMP),
      ('Sarah Brown', 'sarah@example.com', 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150', 'online', CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('✅ Sample users inserted successfully');

    // Show created data
    const result = await client.query('SELECT * FROM users ORDER BY created_at');
    console.log('\n📋 Users in database:');
    console.table(result.rows);

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUsersTable();
