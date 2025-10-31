import pool from '../config/db.js';

// Get my notifications
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only } = req.query;

    let query = `
      SELECT n.*, s.title as service_title
      FROM notifications n
      LEFT JOIN services s ON n.related_service_id = s.id
      WHERE n.user_id = $1
    `;

    const params = [userId];

    if (unread_only === 'true') {
      query += ` AND n.is_read = FALSE`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);

    // Get unread count
    const unreadCount = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadCount.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create notification (helper function - can be used by other controllers)
export const createNotification = async (userId, type, title, message, relatedServiceId = null, priority = 'normal') => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_service_id, priority)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, relatedServiceId, priority]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
