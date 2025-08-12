class Chat {
  constructor() {
    this.tableName = 'chats';
    this.primaryKey = 'id';
  }

  // Define table structure
  getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        type TEXT,
        name TEXT,
        avatar_url TEXT,
        created_by INTEGER
      );
    `;
  }

  // Get all chats
  async findAll(db) {
    const query = `SELECT * FROM ${this.tableName}`;
    const result = await db.query(query);
    return result.rows;
  }

  // Find chat by id
  async findById(db, id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Find chats by type
  async findByType(db, type) {
    const query = `SELECT * FROM ${this.tableName} WHERE type = $1`;
    const result = await db.query(query, [type]);
    return result.rows;
  }

  // Find chats created by user
  async findByCreatedBy(db, userId) {
    const query = `SELECT * FROM ${this.tableName} WHERE created_by = $1`;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // Create new chat
  async create(db, chatData) {
    const { type, name, avatar_url, created_by } = chatData;
    
    const query = `
      INSERT INTO ${this.tableName} 
      (type, name, avatar_url, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await db.query(query, [type, name, avatar_url, created_by]);
    return result.rows[0];
  }

  // Update chat
  async update(db, id, chatData) {
    const { type, name, avatar_url, created_by } = chatData;
    
    const query = `
      UPDATE ${this.tableName}
      SET type = $1, name = $2, avatar_url = $3, created_by = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await db.query(query, [type, name, avatar_url, created_by, id]);
    return result.rows[0] || null;
  }

  // Delete chat
  async delete(db, id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update chat name
  async updateName(db, id, name) {
    const query = `
      UPDATE ${this.tableName}
      SET name = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [name, id]);
    return result.rows[0] || null;
  }

  // Update chat avatar
  async updateAvatar(db, id, avatar_url) {
    const query = `
      UPDATE ${this.tableName}
      SET avatar_url = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [avatar_url, id]);
    return result.rows[0] || null;
  }
}

module.exports = Chat;
