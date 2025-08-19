class User {
  constructor() {
    this.tableName = 'users';
    this.primaryKey = 'id';
  }

  // Define table structure
  getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        username TEXT,
        display_name TEXT,
        email TEXT,
        password_hash TEXT,
        avatar_url TEXT,
        status TEXT,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  // Migration method - no longer needed since database is already updated
  async migrateTable(db) {
    try {
      console.log('User table migration skipped - database already uses TIMESTAMP');
    } catch (error) {
      console.log('Migration note:', error.message);
    }
  }

  // Get all users
  async findAll(db) {
    const query = `SELECT * FROM ${this.tableName}`;
    const result = await db.query(query);
    return result.rows;
  }

  // Find user by id
  async findById(db, id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Find user by username
  async findByUsername(db, username) {
    const query = `SELECT * FROM ${this.tableName} WHERE username = $1`;
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }

  // Find user by email
  async findByEmail(db, email) {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  // Create new user
  async create(db, userData) {
    const { username, display_name, email, password_hash, avatar_url, status, last_seen } = userData;
    
    const query = `
      INSERT INTO ${this.tableName} 
      (username, display_name, email, password_hash, avatar_url, status, last_seen)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      username, display_name, email, password_hash, avatar_url, status, last_seen
    ]);
    
    return result.rows[0];
  }

  // Update user
  async update(db, id, userData) {
    const { username, display_name, email, password_hash, avatar_url, status, last_seen } = userData;
    
    const query = `
      UPDATE ${this.tableName}
      SET username = $1, display_name = $2, email = $3, password_hash = $4, 
          avatar_url = $5, status = $6, last_seen = $7
      WHERE id = $8
      RETURNING *
    `;
    
    const result = await db.query(query, [
      username, display_name, email, password_hash, avatar_url, status, last_seen, id
    ]);
    
    return result.rows[0] || null;
  }

  // Delete user
  async delete(db, id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update last seen with current timestamp
  async updateLastSeen(db, id) {
    const query = `
      UPDATE ${this.tableName}
      SET last_seen = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update status
  async updateStatus(db, id, status) {
    const query = `
      UPDATE ${this.tableName}
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
    return result.rows[0] || null;
  }
}

module.exports = User;
