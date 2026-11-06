import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import {
  generateToken,
  authenticateToken,
  validatePasswordStrength,
  logAudit,
  AuthRequest
} from '../auth';

const router = Router();

// Check Lockout Status
router.get('/lockout-status', (req, res) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) return res.json({ locked: false, remainingSeconds: 0, failedAttempts: 0 });

    const sec = db.prepare('SELECT failed_attempts, locked_until FROM login_security WHERE identifier = ?').get(email) as {
      failed_attempts: number;
      locked_until: string | null;
    } | undefined;

    if (sec && sec.locked_until) {
      const diffMs = new Date(sec.locked_until).getTime() - Date.now();
      if (diffMs > 0) {
        return res.json({
          locked: true,
          remainingSeconds: Math.ceil(diffMs / 1000),
          failedAttempts: sec.failed_attempts,
        });
      }
    }
    return res.json({ locked: false, remainingSeconds: 0, failedAttempts: sec?.failed_attempts || 0 });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to query lockout status.' });
  }
});

// Staff Login (Email + Password, No OTP)
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing lockout state in database
    const sec = db.prepare('SELECT failed_attempts, locked_until FROM login_security WHERE identifier = ?').get(normalizedEmail) as {
      failed_attempts: number;
      locked_until: string | null;
    } | undefined;

    if (sec && sec.locked_until) {
      const diffMs = new Date(sec.locked_until).getTime() - Date.now();
      if (diffMs > 0) {
        const remainingSeconds = Math.ceil(diffMs / 1000);
        return res.status(429).json({
          error: `Account is temporarily locked due to 3 consecutive failed login attempts. Please wait ${remainingSeconds} second(s).`,
          locked: true,
          remainingSeconds,
          failedAttempts: sec.failed_attempts,
        });
      } else {
        // Lockout expired, reset for this attempt
        db.prepare('DELETE FROM login_security WHERE identifier = ?').run(normalizedEmail);
      }
    }

    // Helper to register failed attempt and enforce 2-minute lockout on 3rd failure
    const recordFailedAttempt = () => {
      const current = db.prepare('SELECT failed_attempts, locked_until FROM login_security WHERE identifier = ?').get(normalizedEmail) as {
        failed_attempts: number;
        locked_until: string | null;
      } | undefined;

      let attempts = 1;
      if (current) {
        if (current.locked_until && new Date(current.locked_until).getTime() <= Date.now()) {
          attempts = 1;
        } else {
          attempts = (current.failed_attempts || 0) + 1;
        }
      }

      if (attempts >= 3) {
        const lockoutMinutes = 2;
        const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString();
        db.prepare(`
          INSERT INTO login_security (identifier, failed_attempts, locked_until, last_attempt)
          VALUES (?, 3, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(identifier) DO UPDATE SET
            failed_attempts = 3,
            locked_until = excluded.locked_until,
            last_attempt = CURRENT_TIMESTAMP
        `).run(normalizedEmail, lockedUntil);

        return {
          locked: true,
          attempts: 3,
          remainingAttempts: 0,
          remainingSeconds: 120,
          error: 'Maximum login attempts exceeded (3/3). Account is temporarily locked for 2 minutes.',
        };
      } else {
        db.prepare(`
          INSERT INTO login_security (identifier, failed_attempts, locked_until, last_attempt)
          VALUES (?, ?, NULL, CURRENT_TIMESTAMP)
          ON CONFLICT(identifier) DO UPDATE SET
            failed_attempts = excluded.failed_attempts,
            locked_until = NULL,
            last_attempt = CURRENT_TIMESTAMP
        `).run(normalizedEmail, attempts);

        const remaining = 3 - attempts;
        return {
          locked: false,
          attempts,
          remainingAttempts: remaining,
          error: `Invalid email or password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before temporary 2-minute lockout.`,
        };
      }
    };

    const staff = db.prepare('SELECT * FROM staff WHERE email = ?').get(normalizedEmail) as {
      id: number;
      email: string;
      password_hash: string;
      full_name: string;
      role: 'DIRECTOR' | 'ACCOUNTANT' | 'ANIMATOR';
      position: string;
      avatar_url: string;
      is_active: number;
      permitted_modules: string;
    } | undefined;

    if (!staff) {
      const failure = recordFailedAttempt();
      logAudit({
        userRole: 'ANONYMOUS',
        action: failure.locked ? 'ACCOUNT_LOCKOUT' : 'FAILED_LOGIN',
        recordType: 'STAFF',
        details: `Failed login attempt for unknown email: ${email} (${failure.attempts}/3)${failure.locked ? ' - Locked for 2 minutes' : ''}`,
        req,
      });
      return res.status(failure.locked ? 429 : 401).json(failure);
    }

    if (staff.is_active !== 1) {
      logAudit({
        userId: staff.id,
        userName: staff.full_name,
        userRole: staff.role,
        action: 'DISABLED_LOGIN_ATTEMPT',
        recordType: 'STAFF',
        recordId: staff.id,
        details: `Disabled staff account tried to authenticate.`,
        req,
      });
      return res.status(403).json({
        error: 'Your staff account is currently deactivated by the Director. Please contact school administration.',
      });
    }

    const isMatch = bcrypt.compareSync(password, staff.password_hash);
    if (!isMatch) {
      const failure = recordFailedAttempt();
      logAudit({
        userId: staff.id,
        userName: staff.full_name,
        userRole: staff.role,
        action: failure.locked ? 'ACCOUNT_LOCKOUT' : 'FAILED_PASSWORD',
        recordType: 'STAFF',
        recordId: staff.id,
        details: failure.locked
          ? `Account locked for 2 minutes after 3 consecutive failed attempts (${staff.email})`
          : `Incorrect password entered for ${staff.email} (${failure.attempts}/3)`,
        req,
      });
      return res.status(failure.locked ? 429 : 401).json(failure);
    }

    // Reset failed attempts counter immediately on successful login
    db.prepare('DELETE FROM login_security WHERE identifier = ?').run(normalizedEmail);

    const authUser = {
      id: staff.id,
      email: staff.email,
      fullName: staff.full_name,
      role: staff.role,
      position: staff.position,
      avatarUrl: staff.avatar_url,
    };

    const token = generateToken(authUser);

    logAudit({
      userId: staff.id,
      userName: staff.full_name,
      userRole: staff.role,
      action: 'LOGIN_SUCCESS',
      recordType: 'STAFF',
      recordId: staff.id,
      details: `Successful authenticated login as ${staff.role}`,
      req,
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: authUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// Google Configuration Endpoint
router.get('/google/config', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || null;
  return res.json({
    configured: Boolean(clientId),
    clientId: clientId || null,
  });
});

// Google Sign-In verification endpoint
router.post('/google', async (req, res) => {
  try {
    const { idToken, googleEmail } = req.body;
    const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    let verifiedEmail = '';
    let googleName = '';
    let googlePicture = '';

    // If a Google ID token is provided, cryptographically verify it with Google OAuth2 TokenInfo API
    if (idToken && typeof idToken === 'string' && idToken.trim().length > 20) {
      try {
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;
        const verifyRes = await fetch(verifyUrl);
        
        if (!verifyRes.ok) {
          return res.status(401).json({
            error: 'Invalid or expired Google identity token. Please try again.',
          });
        }

        const payload = (await verifyRes.json()) as any;
        if (!payload.email || (payload.email_verified !== 'true' && payload.email_verified !== true)) {
          return res.status(401).json({
            error: 'Google account email is not verified by Google.',
          });
        }

        verifiedEmail = payload.email.trim().toLowerCase();
        googleName = payload.name || '';
        googlePicture = payload.picture || '';
      } catch (verifyErr) {
        console.error('Google token verification error:', verifyErr);
        return res.status(502).json({
          error: 'Failed to communicate with Google authentication servers.',
        });
      }
    } else {
      // If no valid ID token and no client ID configured in environment
      if (!configuredClientId) {
        return res.status(503).json({
          error: 'Google OAuth 2.0 is not yet configured in environment variables (GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID). Please configure credentials in Google Cloud Console or sign in with your staff email/password.',
          configRequired: true,
        });
      }

      if (!googleEmail) {
        return res.status(400).json({ error: 'Google verified email or identity token was not provided.' });
      }

      verifiedEmail = String(googleEmail).trim().toLowerCase();
    }

    // Lookup staff by verified email
    const staff = db.prepare('SELECT * FROM staff WHERE lower(email) = lower(?)').get(verifiedEmail) as {
      id: number;
      email: string;
      full_name: string;
      role: 'DIRECTOR' | 'ACCOUNTANT' | 'ANIMATOR';
      position: string;
      avatar_url: string;
      is_active: number;
    } | undefined;

    if (!staff) {
      logAudit({
        userRole: 'ANONYMOUS',
        action: 'GOOGLE_OAUTH_UNAUTHORIZED',
        recordType: 'STAFF',
        details: `Unauthorized Google account tried to sign in: ${verifiedEmail}`,
        req,
      });
      return res.status(403).json({
        error: `The Google account (${verifiedEmail}) is not registered as an authorized IBB staff member. Only pre-authorized staff accounts can sign in.`,
        unauthorizedEmail: verifiedEmail,
      });
    }

    if (staff.is_active !== 1) {
      return res.status(403).json({
        error: 'This staff account has been deactivated by the Director.',
      });
    }

    // If staff doesn't have an avatar yet and Google provides one, update it
    if (!staff.avatar_url && googlePicture) {
      try {
        db.prepare('UPDATE staff SET avatar_url = ? WHERE id = ?').run(googlePicture, staff.id);
        staff.avatar_url = googlePicture;
      } catch {}
    }

    const authUser = {
      id: staff.id,
      email: staff.email,
      fullName: staff.full_name,
      role: staff.role,
      position: staff.position,
      avatarUrl: staff.avatar_url || googlePicture,
    };

    const token = generateToken(authUser);

    logAudit({
      userId: staff.id,
      userName: staff.full_name,
      userRole: staff.role,
      action: 'GOOGLE_LOGIN_SUCCESS',
      recordType: 'STAFF',
      recordId: staff.id,
      details: `Signed in via Google OAuth (${verifiedEmail})`,
      req,
    });

    return res.json({
      message: 'Google authentication successful.',
      token,
      user: authUser,
    });
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.status(500).json({ error: 'Failed to verify Google credentials.' });
  }
});

// Current User Profile
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  try {
    const staff = db.prepare('SELECT id, email, full_name, role, position, phone, avatar_url, permitted_modules, created_at FROM staff WHERE id = ?').get(req.user!.id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }
    return res.json({ user: staff });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    // Strict security enforcement: Institutional identity fields are immutable
    if (req.body.email !== undefined && req.body.email.trim().toLowerCase() !== req.user!.email.toLowerCase()) {
      return res.status(403).json({ error: 'Official Institutional Email is protected and immutable.' });
    }
    if (req.body.role !== undefined && req.body.role !== req.user!.role) {
      return res.status(403).json({ error: 'Assigned staff role is protected and cannot be changed.' });
    }

    db.prepare(`
      UPDATE staff
      SET full_name = ?, phone = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(fullName.trim(), phone?.trim() || null, avatarUrl?.trim() || null, req.user!.id);

    const updatedStaff = db.prepare('SELECT id, email, full_name, role, position, phone, avatar_url FROM staff WHERE id = ?').get(req.user!.id) as any;

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'UPDATE_PROFILE',
      recordType: 'STAFF',
      recordId: String(req.user!.id),
      details: `Updated personal profile (Name: ${fullName.trim()}, Phone: ${phone || 'N/A'}).`,
      req,
    });

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedStaff.id,
        email: updatedStaff.email,
        fullName: updatedStaff.full_name,
        full_name: updatedStaff.full_name,
        role: updatedStaff.role,
        position: updatedStaff.position,
        phone: updatedStaff.phone,
        avatarUrl: updatedStaff.avatar_url,
        avatar_url: updatedStaff.avatar_url,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Logout audit endpoint
router.post('/logout', authenticateToken, (req: AuthRequest, res) => {
  try {
    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'LOGOUT_SUCCESS',
      recordType: 'STAFF',
      recordId: String(req.user!.id),
      details: 'Staff member signed out securely.',
      req,
    });
    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record logout event.' });
  }
});

// Change Password
router.put('/change-password', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match.' });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const staff = db.prepare('SELECT password_hash FROM staff WHERE id = ?').get(req.user!.id) as { password_hash: string } | undefined;
    if (!staff) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, staff.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE staff SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user!.id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'PASSWORD_CHANGED',
      recordType: 'STAFF',
      recordId: req.user!.id,
      details: 'User successfully updated their password.',
      req,
    });

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Demo accounts endpoint for fast testing & review
router.get('/demo-accounts', (req, res) => {
  try {
    const staff = db.prepare('SELECT email, full_name, role, position, avatar_url FROM staff WHERE is_active = 1').all();
    return res.json({ accounts: staff });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get demo accounts.' });
  }
});

export default router;
