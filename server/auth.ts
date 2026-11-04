import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';

export const JWT_SECRET = process.env.JWT_SECRET || 'ibb-secret-key-production-buberuka-2026';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: 'DIRECTOR' | 'ACCOUNTANT' | 'ANIMATOR';
  position: string;
  avatarUrl?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      position: user.position,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Verify user is still active in database
    const userRow = db.prepare('SELECT id, is_active FROM staff WHERE id = ?').get(decoded.id) as { id: number; is_active: number } | undefined;
    if (!userRow || userRow.is_active !== 1) {
      return res.status(403).json({ error: 'This staff account has been deactivated or not found.' });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function requireRoles(allowedRoles: ('DIRECTOR' | 'ACCOUNTANT' | 'ANIMATOR')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized to access this module. Required: [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
}

// Strong password validator
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
  }
  return { valid: true };
}

// Audit logger
export function logAudit(options: {
  userId?: number;
  userName?: string;
  userRole?: string;
  action: string;
  recordType: string;
  recordId?: string | number;
  details?: string;
  req?: Request;
}) {
  try {
    const ip = options.req ? (options.req.headers['x-forwarded-for'] as string || options.req.socket.remoteAddress || '127.0.0.1') : 'internal';
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, record_type, record_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      options.userId || null,
      options.userName || 'System',
      options.userRole || 'SYSTEM',
      options.action,
      options.recordType,
      options.recordId ? String(options.recordId) : null,
      options.details || null,
      ip
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// System Notification helper
export function createNotification(options: {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  targetRole?: 'DIRECTOR' | 'ACCOUNTANT' | 'ANIMATOR' | 'ALL';
  link?: string;
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (title, message, type, target_role, link)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      options.title,
      options.message,
      options.type || 'info',
      options.targetRole || 'ALL',
      options.link || null
    );
  } catch (err) {
    console.error('Notification creation error:', err);
  }
}

// Africa/Kigali Stock Schedule Status Evaluator
export function getKigaliStockScheduleStatus(): {
  isPermitted: boolean;
  kigaliTime: string;
  activeScheduleName?: string;
  reason: string;
  nextOpeningTime?: string;
} {
  // Get current time in Africa/Kigali
  const now = new Date();
  const kigaliTimeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now); // e.g. "07:15"

  const schedules = db.prepare('SELECT * FROM stock_schedules WHERE is_active = 1 ORDER BY start_time ASC').all() as Array<{
    id: number;
    name: string;
    start_time: string;
    end_time: string;
  }>;

  for (const s of schedules) {
    if (kigaliTimeStr >= s.start_time && kigaliTimeStr <= s.end_time) {
      return {
        isPermitted: true,
        kigaliTime: kigaliTimeStr,
        activeScheduleName: s.name,
        reason: `Authorized during "${s.name}" (${s.start_time} - ${s.end_time} CAT)`,
      };
    }
  }

  // Find next upcoming schedule today
  const upcoming = schedules.find(s => s.start_time > kigaliTimeStr);
  const nextTime = upcoming ? `${upcoming.start_time} (${upcoming.name})` : (schedules[0] ? `${schedules[0].start_time} tomorrow (${schedules[0].name})` : 'No active schedule configured');

  return {
    isPermitted: false,
    kigaliTime: kigaliTimeStr,
    reason: `Outside authorized Director-configured Stock Out windows (Current Kigali Time: ${kigaliTimeStr} CAT). Next opening: ${nextTime}.`,
    nextOpeningTime: nextTime,
  };
}
