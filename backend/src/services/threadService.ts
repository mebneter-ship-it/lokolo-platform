import { getPool } from '../config/database';
import { Thread, Message } from '../models/types';

/**
 * Create or get existing thread between consumer and supplier
 */
export const getOrCreateThread = async (
  consumerId: string,
  supplierId: string,
  businessId: string,
  subject?: string
): Promise<Thread> => {
  const pool = getPool();
  
  // Check if thread already exists
  const existing = await pool.query(
    `SELECT * FROM threads 
     WHERE consumer_id = $1 AND business_id = $2`,
    [consumerId, businessId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  
  // Create new thread
  const result = await pool.query(
    `INSERT INTO threads (consumer_id, supplier_id, business_id, subject)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [consumerId, supplierId, businessId, subject || null]
  );
  
  return result.rows[0];
};

/**
 * Get thread by ID
 */
export const getThreadById = async (threadId: string): Promise<Thread | null> => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM threads WHERE id = $1', [threadId]);
  return result.rows[0] || null;
};

/**
 * Get user's threads
 */
export const getUserThreads = async (
  userId: string,
  role: 'consumer' | 'supplier',
  page: number = 1,
  limit: number = 20
): Promise<{ threads: any[]; total: number }> => {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  const roleColumn = role === 'consumer' ? 'consumer_id' : 'supplier_id';
  const archivedColumn = role === 'consumer' ? 'is_archived_by_consumer' : 'is_archived_by_supplier';
  
  // Get threads with last message preview
  const result = await pool.query(
    `SELECT 
      t.*,
      b.name as business_name,
      u.display_name as other_party_name,
      u.profile_photo_url as other_party_photo,
      m.message_text as last_message_preview,
      (SELECT COUNT(*) FROM messages 
       WHERE thread_id = t.id AND sender_id != $1 AND is_read = false) as unread_count
     FROM threads t
     INNER JOIN businesses b ON t.business_id = b.id
     INNER JOIN users u ON u.id = ${role === 'consumer' ? 't.supplier_id' : 't.consumer_id'}
     LEFT JOIN LATERAL (
       SELECT message_text FROM messages 
       WHERE thread_id = t.id 
       ORDER BY created_at DESC 
       LIMIT 1
     ) m ON true
     WHERE t.${roleColumn} = $1 AND t.${archivedColumn} = false
     ORDER BY t.last_message_at DESC NULLS LAST, t.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM threads 
     WHERE ${roleColumn} = $1 AND ${archivedColumn} = false`,
    [userId]
  );
  
  return {
    threads: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Send message in thread
 */
export const sendMessage = async (
  threadId: string,
  senderId: string,
  messageText: string
): Promise<Message> => {
  const pool = getPool();
  
  const result = await pool.query(
    `INSERT INTO messages (thread_id, sender_id, message_text)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [threadId, senderId, messageText]
  );
  
  return result.rows[0];
};

/**
 * Get messages in thread
 */
export const getThreadMessages = async (
  threadId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: Message[]; total: number }> => {
  const pool = getPool();
  const offset = (page - 1) * limit;
  
  const result = await pool.query(
    `SELECT m.*, u.display_name as sender_name, u.profile_photo_url as sender_photo
     FROM messages m
     INNER JOIN users u ON m.sender_id = u.id
     WHERE m.thread_id = $1
     ORDER BY m.created_at ASC
     LIMIT $2 OFFSET $3`,
    [threadId, limit, offset]
  );
  
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM messages WHERE thread_id = $1',
    [threadId]
  );
  
  return {
    messages: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (threadId: string, userId: string): Promise<void> => {
  const pool = getPool();
  
  await pool.query(
    `UPDATE messages 
     SET is_read = true, read_at = CURRENT_TIMESTAMP
     WHERE thread_id = $1 AND sender_id != $2 AND is_read = false`,
    [threadId, userId]
  );
};

/**
 * Archive thread
 */
export const archiveThread = async (threadId: string, userId: string, role: 'consumer' | 'supplier'): Promise<void> => {
  const pool = getPool();
  const column = role === 'consumer' ? 'is_archived_by_consumer' : 'is_archived_by_supplier';
  
  await pool.query(
    `UPDATE threads SET ${column} = true WHERE id = $1`,
    [threadId]
  );
};

/**
 * Unarchive thread
 */
export const unarchiveThread = async (threadId: string, userId: string, role: 'consumer' | 'supplier'): Promise<void> => {
  const pool = getPool();
  const column = role === 'consumer' ? 'is_archived_by_consumer' : 'is_archived_by_supplier';
  
  await pool.query(
    `UPDATE threads SET ${column} = false WHERE id = $1`,
    [threadId]
  );
};

/**
 * Get unread message count for user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const pool = getPool();
  
  const result = await pool.query(
    `SELECT COUNT(*) FROM messages m
     INNER JOIN threads t ON m.thread_id = t.id
     WHERE (t.consumer_id = $1 OR t.supplier_id = $1)
     AND m.sender_id != $1
     AND m.is_read = false`,
    [userId]
  );
  
  return parseInt(result.rows[0].count);
};
