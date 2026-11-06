import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import {
  authenticateToken,
  logAudit,
  createNotification,
  AuthRequest,
  JWT_SECRET,
  AuthUser
} from '../auth';

const router = Router();

function generateMessageRef(): string {
  const year = new Date().getFullYear();
  const lastMsg = db.prepare(`
    SELECT reference_number FROM contact_messages
    WHERE reference_number LIKE 'MSG-${year}-%'
    ORDER BY id DESC LIMIT 1
  `).get() as { reference_number: string } | undefined;

  let seq = 1;
  if (lastMsg && lastMsg.reference_number) {
    const parts = lastMsg.reference_number.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      seq = lastNum + 1;
    }
  }
  return `MSG-${year}-${String(seq).padStart(4, '0')}`;
}

// Public: Submit Contact Message (Protected against staff self-submission)
router.post('/', (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Backend 403 Enforcement: Authenticated staff cannot submit public inquiries
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        if (decoded && ['DIRECTOR', 'ACCOUNTANT', 'ANIMATOR'].includes(decoded.role)) {
          return res.status(403).json({
            error: 'Staff members (Director, Accountant, Animator) are restricted from submitting public contact messages while authenticated. Please use the internal dashboard messaging system.',
            code: 'STAFF_FORBIDDEN',
          });
        }
      } catch {
        // proceed if token is expired/invalid
      }
    }

    // Check if submitted email matches any active staff member
    const staffMatch = db.prepare('SELECT id, role FROM staff WHERE LOWER(email) = LOWER(?)').get(email.trim().toLowerCase()) as { id: number; role: string } | undefined;
    if (staffMatch) {
      return res.status(403).json({
        error: 'Institutional staff accounts are restricted from public contact submissions. Please use your internal dashboard or log out.',
        code: 'STAFF_FORBIDDEN',
      });
    }

    const refNumber = generateMessageRef();

    const stmt = db.prepare(`
      INSERT INTO contact_messages (reference_number, sender_name, sender_email, sender_phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, ?, 'New')
    `);

    stmt.run(
      refNumber,
      name.trim(),
      email.trim().toLowerCase(),
      phone?.trim() || null,
      subject.trim(),
      message.trim()
    );

    logAudit({
      action: 'CONTACT_MESSAGE_SUBMITTED',
      recordType: 'MESSAGE',
      recordId: refNumber,
      details: `Inquiry from ${name} (${email}): "${subject}"`,
      req,
    });

    createNotification({
      title: 'New Contact Inquiry Received',
      message: `From: ${name} — "${subject}" (Ref: ${refNumber})`,
      type: 'info',
      targetRole: 'DIRECTOR',
      link: '/dashboard/director/messages',
    });

    return res.status(201).json({
      message: 'Your message has been received by IBB Administration. A member of our team will get in touch shortly.',
      referenceNumber: refNumber,
    });
  } catch (err) {
    console.error('Contact message error:', err);
    return res.status(500).json({ error: 'Failed to submit message. Please try again.' });
  }
});

// Protected: List Contact Messages
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT cm.*, s.full_name as replied_by_name
      FROM contact_messages cm
      LEFT JOIN staff s ON cm.replied_by = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND cm.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (cm.sender_name LIKE ? OR cm.reference_number LIKE ? OR cm.subject LIKE ? OR cm.message LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY cm.id DESC';
    const messages = db.prepare(query).all(...params);

    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// Protected: Update Message Status / Add Reply
router.put('/:id/status', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, replyNotes } = req.body;

    if (!['New', 'Read', 'Replied', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid message status.' });
    }

    db.prepare(`
      UPDATE contact_messages
      SET status = ?, reply_notes = ?, replied_by = ?
      WHERE id = ?
    `).run(status, replyNotes || null, req.user!.id, id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'UPDATE_MESSAGE_STATUS',
      recordType: 'MESSAGE',
      recordId: id,
      details: `Updated message status to ${status}`,
      req,
    });

    return res.json({ message: 'Message updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update message.' });
  }
});

export default router;
