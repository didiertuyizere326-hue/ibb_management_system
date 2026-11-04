import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../auth';

const router = Router();

// Get notifications for current user's role
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE target_role = 'ALL' OR target_role = ?
      ORDER BY id DESC
      LIMIT 50
    `).all(role);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE is_read = 0 AND (target_role = 'ALL' OR target_role = ?)
    `).get(role) as { count: number };

    return res.json({
      notifications,
      unreadCount: unreadCount.count,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    return res.json({ message: 'Marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE target_role = 'ALL' OR target_role = ?
    `).run(role);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark notifications.' });
  }
});

export default router;
