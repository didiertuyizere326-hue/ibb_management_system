import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requireRoles, AuthRequest } from '../auth';

const router = Router();

// Director: List audit logs with pagination and filters
router.get('/', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { action, recordType, search, limit = '100' } = req.query;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (action && action !== 'all') {
      query += ' AND action = ?';
      params.push(action);
    }
    if (recordType && recordType !== 'all') {
      query += ' AND record_type = ?';
      params.push(recordType);
    }
    if (search) {
      query += ' AND (user_name LIKE ? OR details LIKE ? OR record_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit as string, 10) || 100);

    const logs = db.prepare(query).all(...params);
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve system audit logs.' });
  }
});

export default router;
