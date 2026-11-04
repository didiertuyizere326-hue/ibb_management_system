import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import {
  authenticateToken,
  requireRoles,
  validatePasswordStrength,
  logAudit,
  createNotification,
  AuthRequest
} from '../auth';

const router = Router();

// Director: List all staff accounts
router.get('/', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const staff = db.prepare(`
      SELECT id, email, full_name, role, position, phone, avatar_url, is_active, permitted_modules, created_at, updated_at
      FROM staff
      ORDER BY id ASC
    `).all();

    return res.json({ staff });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve staff accounts.' });
  }
});

// Director: Create new staff account
router.post('/', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { email, password, fullName, role, position, phone, avatarUrl, permittedModules } = req.body;

    if (!email || !password || !fullName || !role || !position) {
      return res.status(400).json({ error: 'Email, password, full name, role, and position are required.' });
    }

    if (!['DIRECTOR', 'ACCOUNTANT', 'ANIMATOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid staff role specified.' });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`
      INSERT INTO staff (email, password_hash, full_name, role, position, phone, avatar_url, is_active, permitted_modules)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const result = stmt.run(
      email.trim().toLowerCase(),
      passwordHash,
      fullName.trim(),
      role,
      position.trim(),
      phone?.trim() || null,
      avatarUrl || null,
      permittedModules || 'all'
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'CREATE_STAFF_ACCOUNT',
      recordType: 'STAFF',
      recordId: String(result.lastInsertRowid),
      details: `Created new staff account for ${fullName} (${role})`,
      req,
    });

    createNotification({
      title: 'New Staff Account Provisioned',
      message: `${fullName} has been granted access as ${role}.`,
      type: 'info',
      targetRole: 'DIRECTOR',
      link: '/dashboard/director/staff',
    });

    return res.status(201).json({
      message: 'Staff account created successfully.',
      staffId: result.lastInsertRowid,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'A staff account with this email address already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create staff account.' });
  }
});

// Director: Update staff details & permissions
router.put('/:id', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, position, phone, permittedModules } = req.body;

    const targetStaff = db.prepare('SELECT * FROM staff WHERE id = ?').get(id) as { id: number; email: string } | undefined;
    if (!targetStaff) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    db.prepare(`
      UPDATE staff
      SET full_name = ?, role = ?, position = ?, phone = ?, permitted_modules = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      fullName.trim(),
      role,
      position.trim(),
      phone?.trim() || null,
      permittedModules || 'all',
      id
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'UPDATE_STAFF_PERMISSIONS',
      recordType: 'STAFF',
      recordId: id,
      details: `Updated role (${role}) & permissions for ${targetStaff.email}`,
      req,
    });

    return res.json({ message: 'Staff profile and permissions updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update staff account.' });
  }
});

// Director: Toggle Staff Active/Disabled Status
router.put('/:id/toggle-status', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    // Prevent self-deactivation by Director
    if (targetId === req.user!.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own active Director account.' });
    }

    const staff = db.prepare('SELECT id, full_name, email, is_active FROM staff WHERE id = ?').get(targetId) as {
      id: number;
      full_name: string;
      email: string;
      is_active: number;
    } | undefined;

    if (!staff) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    const newStatus = staff.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE staff SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, targetId);

    const actionText = newStatus === 1 ? 'ACTIVATED' : 'DEACTIVATED';

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: `STAFF_${actionText}`,
      recordType: 'STAFF',
      recordId: targetId,
      details: `Director ${actionText.toLowerCase()} access for ${staff.full_name} (${staff.email})`,
      req,
    });

    return res.json({
      message: `Staff account ${staff.full_name} has been ${newStatus === 1 ? 'activated' : 'deactivated'}.`,
      isActive: newStatus === 1,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to modify account active status.' });
  }
});

export default router;
