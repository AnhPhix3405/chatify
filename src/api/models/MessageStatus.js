class MessageStatus {
  constructor() {
    this.tableName = 'message_status';
    this.primaryKey = 'id';
  }

  // Define table structure
  getTableSchema() {
    return `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        message_id INTEGER,
        user_id INTEGER,
        status TEXT
      );
    `;
  }

  // Get all message statuses
  async findAll(db) {
    const query = `SELECT * FROM ${this.tableName}`;
    const result = await db.query(query);
    return result.rows;
  }

  // Find message status by id
  async findById(db, id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Find status by message_id
  async findByMessageId(db, messageId) {
    const query = `SELECT * FROM ${this.tableName} WHERE message_id = $1`;
    const result = await db.query(query, [messageId]);
    return result.rows;
  }

  // Find status by user_id
  async findByUserId(db, userId) {
    const query = `SELECT * FROM ${this.tableName} WHERE user_id = $1`;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  // Find specific message status
  async findByMessageAndUser(db, messageId, userId) {
    const query = `SELECT * FROM ${this.tableName} WHERE message_id = $1 AND user_id = $2`;
    const result = await db.query(query, [messageId, userId]);
    return result.rows[0] || null;
  }

  // Find statuses by status type
  async findByStatus(db, status) {
    const query = `SELECT * FROM ${this.tableName} WHERE status = $1`;
    const result = await db.query(query, [status]);
    return result.rows;
  }

  // Create new message status
  async create(db, statusData) {
    const { message_id, user_id, status } = statusData;
    
    const query = `
      INSERT INTO ${this.tableName} 
      (message_id, user_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [message_id, user_id, status]);
    return result.rows[0];
  }

  // Update message status
  async update(db, id, statusData) {
    const { message_id, user_id, status } = statusData;
    
    const query = `
      UPDATE ${this.tableName}
      SET message_id = $1, user_id = $2, status = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [message_id, user_id, status, id]);
    return result.rows[0] || null;
  }

  // Delete message status
  async delete(db, id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update status only
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

  // Update status by message and user
  async updateStatusByMessageAndUser(db, messageId, userId, status) {
    const query = `
      UPDATE ${this.tableName}
      SET status = $1
      WHERE message_id = $2 AND user_id = $3
      RETURNING *
    `;
    const result = await db.query(query, [status, messageId, userId]);
    return result.rows[0] || null;
  }

  // Delete status by message and user
  async deleteByMessageAndUser(db, messageId, userId) {
    const query = `DELETE FROM ${this.tableName} WHERE message_id = $1 AND user_id = $2 RETURNING *`;
    const result = await db.query(query, [messageId, userId]);
    return result.rows[0] || null;
  }
}

module.exports = MessageStatus;
