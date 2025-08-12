class Message {
  constructor() {
    this.tableName = 'messages';
    this.primaryKey = 'id';
  }

  // Define table structure
  getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        chat_id INTEGER,
        sender_id INTEGER,
        content TEXT,
        message_type TEXT,
        reply_to_id TEXT
      );
    `;
  }

  // Get all messages
  async findAll(db) {
    const query = `SELECT * FROM ${this.tableName}`;
    const result = await db.query(query);
    return result.rows;
  }

  // Find message by id
  async findById(db, id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Find messages by chat_id
  async findByChatId(db, chatId) {
    const query = `SELECT * FROM ${this.tableName} WHERE chat_id = $1 ORDER BY id ASC`;
    const result = await db.query(query, [chatId]);
    return result.rows;
  }

  // Find messages by sender_id
  async findBySenderId(db, senderId) {
    const query = `SELECT * FROM ${this.tableName} WHERE sender_id = $1`;
    const result = await db.query(query, [senderId]);
    return result.rows;
  }

  // Find messages by message_type
  async findByMessageType(db, messageType) {
    const query = `SELECT * FROM ${this.tableName} WHERE message_type = $1`;
    const result = await db.query(query, [messageType]);
    return result.rows;
  }

  // Find messages by reply_to_id
  async findByReplyToId(db, replyToId) {
    const query = `SELECT * FROM ${this.tableName} WHERE reply_to_id = $1`;
    const result = await db.query(query, [replyToId]);
    return result.rows;
  }

  // Create new message
  async create(db, messageData) {
    const { chat_id, sender_id, content, message_type, reply_to_id } = messageData;
    
    const query = `
      INSERT INTO ${this.tableName} 
      (chat_id, sender_id, content, message_type, reply_to_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [chat_id, sender_id, content, message_type, reply_to_id]);
    return result.rows[0];
  }

  // Update message
  async update(db, id, messageData) {
    const { chat_id, sender_id, content, message_type, reply_to_id } = messageData;
    
    const query = `
      UPDATE ${this.tableName}
      SET chat_id = $1, sender_id = $2, content = $3, message_type = $4, reply_to_id = $5
      WHERE id = $6
      RETURNING *
    `;
    
    const result = await db.query(query, [chat_id, sender_id, content, message_type, reply_to_id, id]);
    return result.rows[0] || null;
  }

  // Delete message
  async delete(db, id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update message content
  async updateContent(db, id, content) {
    const query = `
      UPDATE ${this.tableName}
      SET content = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [content, id]);
    return result.rows[0] || null;
  }

  // Get latest message in chat
  async getLatestByChatId(db, chatId) {
    const query = `SELECT * FROM ${this.tableName} WHERE chat_id = $1 ORDER BY id DESC LIMIT 1`;
    const result = await db.query(query, [chatId]);
    return result.rows[0] || null;
  }

  // Get messages with pagination
  async findByChatIdWithPagination(db, chatId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE chat_id = $1 
      ORDER BY id ASC 
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [chatId, limit, offset]);
    return result.rows;
  }
}

module.exports = Message;
