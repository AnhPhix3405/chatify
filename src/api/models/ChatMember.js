class ChatMember {
  constructor() {
    this.tableName = 'chat_members';
    this.primaryKey = 'id';
  }

  // Define table structure
  getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        chat_id INTEGER,
        user_id INTEGER,
        role TEXT
      );
    `;
  }

  // Get all chat members
  async findAll(db) {
    const query = `SELECT * FROM ${this.tableName}`;
    const result = await db.query(query);
    return result.rows;
  }

  // Find chat member by id
  async findById(db, id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Find members by chat_id
  async findByChatId(db, chatId) {
    const query = `SELECT * FROM ${this.tableName} WHERE chat_id = $1`;
    const result = await db.query(query, [chatId]);
    return result.rows;
  }

  // Find chats by user_id
  async findByUserId(db, userId) {
    const query = `SELECT * FROM ${this.tableName} WHERE user_id = $1`;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // Find specific chat member
  async findByChatAndUser(db, chatId, userId) {
    const query = `SELECT * FROM ${this.tableName} WHERE chat_id = $1 AND user_id = $2`;
    const result = await db.query(query, [chatId, userId]);
    return result.rows[0] || null;
  }

  // Find members by role
  async findByRole(db, role) {
    const query = `SELECT * FROM ${this.tableName} WHERE role = $1`;
    const result = await db.query(query, [role]);
    return result.rows;
  }

  // Create new chat member
  async create(db, memberData) {
    const { chat_id, user_id, role } = memberData;
    
    const query = `
      INSERT INTO ${this.tableName} 
      (chat_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [chat_id, user_id, role]);
    return result.rows[0];
  }

  // Update chat member
  async update(db, id, memberData) {
    const { chat_id, user_id, role } = memberData;
    
    const query = `
      UPDATE ${this.tableName}
      SET chat_id = $1, user_id = $2, role = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [chat_id, user_id, role, id]);
    return result.rows[0] || null;
  }

  // Delete chat member
  async delete(db, id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update member role
  async updateRole(db, id, role) {
    const query = `
      UPDATE ${this.tableName}
      SET role = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [role, id]);
    return result.rows[0] || null;
  }

  // Remove user from chat
  async removeUserFromChat(db, chatId, userId) {
    const query = `DELETE FROM ${this.tableName} WHERE chat_id = $1 AND user_id = $2 RETURNING *`;
    const result = await db.query(query, [chatId, userId]);
    return result.rows[0] || null;
  }
}

module.exports = ChatMember;
