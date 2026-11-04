import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import {
  authenticateToken,
  requireRoles,
  logAudit,
  createNotification,
  AuthRequest,
  JWT_SECRET
} from '../auth';

const router = Router();

// Academic settings: GET
router.get('/academic', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM academic_settings ORDER BY id DESC LIMIT 1').get();
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve academic settings.' });
  }
});

// Academic settings: PUT (Director Only)
router.put('/academic', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { minAdmissionMarks, boardingThreshold, autoRejectBelowMin, academicYear, isAdmissionOpen } = req.body;

    const minMarks = parseFloat(minAdmissionMarks);
    const boarding = parseFloat(boardingThreshold);

    if (isNaN(minMarks) || isNaN(boarding)) {
      return res.status(400).json({ error: 'Threshold values must be valid numbers.' });
    }

    db.prepare(`
      UPDATE academic_settings
      SET min_admission_marks = ?, boarding_threshold = ?, auto_reject_below_min = ?, academic_year = ?, is_admission_open = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM academic_settings ORDER BY id DESC LIMIT 1)
    `).run(
      minMarks,
      boarding,
      autoRejectBelowMin ? 1 : 0,
      academicYear || '2026-2027',
      isAdmissionOpen ? 1 : 0
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'UPDATE_ACADEMIC_SETTINGS',
      recordType: 'SETTINGS',
      details: `Min Admission: ${minMarks}%, Boarding: ${boarding}%, Auto-Reject: ${autoRejectBelowMin ? 'Enabled' : 'Disabled'}, Session: ${academicYear}`,
      req,
    });

    return res.json({ message: 'Academic criteria and admission settings updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update academic settings.' });
  }
});

// Stock schedules: GET (Viewable by Director, Accountant, Animator)
router.get('/schedules', authenticateToken, (req: AuthRequest, res) => {
  try {
    const schedules = db.prepare(`
      SELECT
        s.*,
        COALESCE(s.updated_by_name, 'Uwimana Claire (Chief Accountant)') as updated_by_name,
        COALESCE(s.updated_at, s.created_at) as updated_at
      FROM stock_schedules s
      ORDER BY s.start_time ASC
    `).all();
    return res.json({ schedules });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve stock schedules.' });
  }
});

// Stock schedules: POST (Accountant ONLY)
router.post('/schedules', authenticateToken, (req: AuthRequest, res) => {
  try {
    // Check permission: ACCOUNTANT is exclusively responsible
    if (req.user!.role !== 'ACCOUNTANT') {
      logAudit({
        userId: req.user!.id,
        userName: req.user!.fullName,
        userRole: req.user!.role,
        action: 'UNAUTHORIZED_SCHEDULE_MODIFICATION_ATTEMPT',
        recordType: 'SCHEDULE',
        details: `${req.user!.role} attempted to create a Stock Out schedule. Only the Chief Accountant is authorized.`,
        req,
      });
      return res.status(403).json({
        error: 'Permission denied: Only the Chief Accountant is authorized to configure Stock Out working schedules. The Director has view-only access.',
      });
    }

    const { name, startTime, endTime, daysOfWeek } = req.body;
    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: 'Schedule name, start time (HH:MM), and end time (HH:MM) are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO stock_schedules (name, start_time, end_time, is_active, days_of_week, updated_by, updated_by_name, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const accountantName = `${req.user!.fullName} (Chief Accountant)`;
    const result = stmt.run(
      name.trim(),
      startTime.trim(),
      endTime.trim(),
      daysOfWeek || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      req.user!.id,
      accountantName
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'CREATE_STOCK_SCHEDULE',
      recordType: 'SCHEDULE',
      recordId: String(result.lastInsertRowid),
      details: `Accountant created stock working window: ${name} (${startTime} - ${endTime})`,
      req,
    });

    createNotification({
      title: 'Stock Out Schedule Configured',
      message: `New authorized Stock Out window "${name}" (${startTime} - ${endTime}) configured by Accountant ${req.user!.fullName}.`,
      type: 'info',
      targetRole: 'ALL',
      link: '/dashboard/accountant/schedules',
    });

    return res.status(201).json({ message: 'Stock working schedule created.', scheduleId: result.lastInsertRowid });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create stock schedule.' });
  }
});

// Stock schedules: PUT (Accountant ONLY)
router.put('/schedules/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check permission: ACCOUNTANT is exclusively responsible
    if (req.user!.role !== 'ACCOUNTANT') {
      logAudit({
        userId: req.user!.id,
        userName: req.user!.fullName,
        userRole: req.user!.role,
        action: 'UNAUTHORIZED_SCHEDULE_MODIFICATION_ATTEMPT',
        recordType: 'SCHEDULE',
        recordId: id,
        details: `${req.user!.role} attempted to modify Stock Out schedule ID ${id}. Only the Chief Accountant is authorized.`,
        req,
      });
      return res.status(403).json({
        error: 'Permission denied: Only the Chief Accountant is authorized to modify Stock Out working schedules. The Director has view-only access.',
      });
    }

    const { name, startTime, endTime, isActive, daysOfWeek } = req.body;

    const existing = db.prepare('SELECT * FROM stock_schedules WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found.' });
    }

    const accountantName = `${req.user!.fullName} (Chief Accountant)`;
    const newActiveState = isActive !== undefined ? (isActive ? 1 : 0) : 1;

    db.prepare(`
      UPDATE stock_schedules
      SET name = ?, start_time = ?, end_time = ?, is_active = ?, days_of_week = ?, updated_by = ?, updated_by_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name.trim(),
      startTime.trim(),
      endTime.trim(),
      newActiveState,
      daysOfWeek || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      req.user!.id,
      accountantName,
      id
    );

    let auditAction = 'UPDATE_STOCK_SCHEDULE';
    if (existing.is_active !== newActiveState) {
      auditAction = newActiveState === 1 ? 'ACTIVATE_STOCK_SCHEDULE' : 'DEACTIVATE_STOCK_SCHEDULE';
    }

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: auditAction,
      recordType: 'SCHEDULE',
      recordId: id,
      details: `Accountant updated schedule ${name} (${startTime} - ${endTime}, Active: ${newActiveState})`,
      req,
    });

    createNotification({
      title: 'Stock Out Schedule Modified',
      message: `Stock Out window "${name}" updated by Chief Accountant ${req.user!.fullName}. Status: ${newActiveState === 1 ? 'ACTIVE' : 'DISABLED'}.`,
      type: 'info',
      targetRole: 'ALL',
      link: '/dashboard/accountant/schedules',
    });

    return res.json({ message: 'Stock schedule updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

// Stock schedules: DELETE (Accountant ONLY)
router.delete('/schedules/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check permission: ACCOUNTANT is exclusively responsible
    if (req.user!.role !== 'ACCOUNTANT') {
      logAudit({
        userId: req.user!.id,
        userName: req.user!.fullName,
        userRole: req.user!.role,
        action: 'UNAUTHORIZED_SCHEDULE_MODIFICATION_ATTEMPT',
        recordType: 'SCHEDULE',
        recordId: id,
        details: `${req.user!.role} attempted to delete Stock Out schedule ID ${id}. Only the Chief Accountant is authorized.`,
        req,
      });
      return res.status(403).json({
        error: 'Permission denied: Only the Chief Accountant is authorized to delete Stock Out working schedules. The Director has view-only access.',
      });
    }

    db.prepare('DELETE FROM stock_schedules WHERE id = ?').run(id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'DELETE_STOCK_SCHEDULE',
      recordType: 'SCHEDULE',
      recordId: id,
      details: `Accountant removed stock schedule window ID ${id}`,
      req,
    });

    return res.json({ message: 'Stock schedule deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete schedule.' });
  }
});

// ==========================================================
// PARENT PAYMENT NOTICE ENDPOINTS (DIRECTOR-MANAGED)
// ==========================================================

// Public: Get currently published active payment notice for Admissions Page
router.get('/payment-notice', (req, res) => {
  try {
    const notice = db.prepare(`
      SELECT
        pn.*,
        st.full_name as author_name,
        st.position as author_position
      FROM payment_notices pn
      LEFT JOIN staff st ON pn.uploaded_by = st.id
      WHERE pn.is_active = 1
      ORDER BY pn.id DESC
      LIMIT 1
    `).get() as any;

    return res.json({ notice: notice || null });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch payment notice.' });
  }
});

// Director: List all payment notices (active and archived)
router.get('/payment-notices', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const notices = db.prepare(`
      SELECT
        pn.*,
        COALESCE(st.full_name, pn.uploaded_by_name) as uploaded_by_name
      FROM payment_notices pn
      LEFT JOIN staff st ON pn.uploaded_by = st.id
      ORDER BY pn.id DESC
    `).all();

    return res.json({ notices });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch payment notices list.' });
  }
});

// Director: Upload & Publish Parent Payment Notice Image
router.post('/payment-notice', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { title, description, imageUrl, bankName, accountNumber, accountName, academicYear } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Payment notice image is required.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Official notice title is required.' });
    }

    const currentAcademicYear = academicYear?.trim() || (db.prepare('SELECT academic_year FROM academic_settings ORDER BY id DESC LIMIT 1').get() as any)?.academic_year || '2026-2027';

    // Set any previously active notices to inactive if new one is published
    db.prepare('UPDATE payment_notices SET is_active = 0 WHERE is_active = 1').run();

    const stmt = db.prepare(`
      INSERT INTO payment_notices (title, description, image_url, is_active, bank_name, account_number, account_name, academic_year, uploaded_by, uploaded_by_name)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      description?.trim() || null,
      imageUrl.trim(),
      bankName?.trim() || 'Bank of Kigali (BK)',
      accountNumber?.trim() || '00040-0694231-89',
      accountName?.trim() || 'Institut Baptiste de Buberuka (IBB)',
      currentAcademicYear,
      req.user!.id,
      req.user!.fullName
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'PUBLISH_PAYMENT_NOTICE',
      recordType: 'PAYMENT_NOTICE',
      recordId: String(result.lastInsertRowid),
      details: `Director published parent bank payment notice for Session ${currentAcademicYear}: "${title}"`,
      req,
    });

    createNotification({
      title: 'New Parent Payment Notice Published',
      message: `Director published: "${title}". Visible to all parents on Admissions page.`,
      type: 'info',
      targetRole: 'ALL',
      link: '/admissions',
    });

    const newNotice = db.prepare('SELECT * FROM payment_notices WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      message: 'Parent payment notice published successfully. It is now live on the public admissions page.',
      notice: newNotice,
    });
  } catch (err) {
    console.error('Publish payment notice error:', err);
    return res.status(500).json({ error: 'Failed to publish payment notice.' });
  }
});

// Director: Toggle payment notice visibility (active / disabled)
router.put('/payment-notice/:id/toggle', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const notice = db.prepare('SELECT * FROM payment_notices WHERE id = ?').get(id) as any;

    if (!notice) {
      return res.status(404).json({ error: 'Payment notice not found.' });
    }

    const newStatus = notice.is_active === 1 ? 0 : 1;
    if (newStatus === 1) {
      // Deactivate all others so only one is active at a time
      db.prepare('UPDATE payment_notices SET is_active = 0').run();
    }

    db.prepare('UPDATE payment_notices SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: newStatus === 1 ? 'ACTIVATE_PAYMENT_NOTICE' : 'DEACTIVATE_PAYMENT_NOTICE',
      recordType: 'PAYMENT_NOTICE',
      recordId: id,
      details: `Director changed payment notice active state to ${newStatus === 1 ? 'ACTIVE' : 'DISABLED'}`,
      req,
    });

    return res.json({
      message: `Payment notice is now ${newStatus === 1 ? 'published and active' : 'disabled and hidden from parents'}.`,
      isActive: newStatus === 1,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle payment notice.' });
  }
});

// Director: Delete payment notice
router.delete('/payment-notice/:id', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const notice = db.prepare('SELECT * FROM payment_notices WHERE id = ?').get(id) as any;

    if (!notice) {
      return res.status(404).json({ error: 'Payment notice not found.' });
    }

    db.prepare('DELETE FROM payment_notices WHERE id = ?').run(id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'DELETE_PAYMENT_NOTICE',
      recordType: 'PAYMENT_NOTICE',
      recordId: id,
      details: `Director deleted parent payment notice ID ${id}`,
      req,
    });

    return res.json({ message: 'Payment notice deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete payment notice.' });
  }
});

// ========================================================
// SCHOOL BANK ACCOUNTS MANAGEMENT (Accountant & Director)
// ========================================================

// GET /settings/bank-accounts (Public sees active accounts; Accountant/Director see all)
router.get('/bank-accounts', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let isPrivileged = false;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.role === 'ACCOUNTANT' || decoded?.role === 'DIRECTOR') {
          isPrivileged = true;
        }
      } catch {}
    }

    const accounts = isPrivileged
      ? db.prepare(`
          SELECT sba.*,
            COALESCE(st.full_name, sba.created_by_name) as creator_name
          FROM school_bank_accounts sba
          LEFT JOIN staff st ON sba.created_by = st.id
          ORDER BY sba.is_primary DESC, sba.display_order ASC, sba.id ASC
        `).all()
      : db.prepare(`
          SELECT sba.id, sba.bank_name, sba.account_number, sba.account_holder, sba.institution_name,
                 sba.branch, sba.swift_code, sba.currency, sba.payment_instructions, sba.is_primary, sba.display_order
          FROM school_bank_accounts sba
          WHERE sba.is_active = 1
          ORDER BY sba.is_primary DESC, sba.display_order ASC, sba.id ASC
        `).all();

    return res.json({ accounts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve school bank accounts.' });
  }
});

// POST /settings/bank-accounts (Accountant & Director Only)
router.post('/bank-accounts', authenticateToken, requireRoles(['ACCOUNTANT', 'DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { bankName, accountNumber, accountHolder, institutionName, branch, swiftCode, currency, paymentInstructions, isPrimary, displayOrder } = req.body;

    if (!bankName || !bankName.trim() || !accountNumber || !accountNumber.trim()) {
      return res.status(400).json({ error: 'Bank name and official account number are required.' });
    }

    const primaryFlag = isPrimary ? 1 : 0;
    if (primaryFlag === 1) {
      db.prepare('UPDATE school_bank_accounts SET is_primary = 0').run();
    }

    const stmt = db.prepare(`
      INSERT INTO school_bank_accounts (
        bank_name, account_number, account_holder, institution_name, branch, swift_code, currency, payment_instructions, is_primary, is_active, display_order, created_by, created_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);

    const result = stmt.run(
      bankName.trim(),
      accountNumber.trim(),
      accountHolder?.trim() || 'Institut Baptiste de Buberuka (IBB)',
      institutionName?.trim() || 'Institut Baptiste de Buberuka (IBB)',
      branch?.trim() || null,
      swiftCode?.trim() || null,
      currency?.trim() || 'RWF',
      paymentInstructions?.trim() || null,
      primaryFlag,
      parseInt(displayOrder, 10) || 1,
      req.user!.id,
      req.user!.fullName
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'CREATE_BANK_ACCOUNT',
      recordType: 'FINANCIAL_SETTINGS',
      recordId: String(result.lastInsertRowid),
      details: `${req.user!.role} created school payment account: ${bankName} (${accountNumber})`,
      req,
    });

    createNotification({
      title: 'School Bank Account Added',
      message: `${req.user!.fullName} configured official payment channel "${bankName}" (${accountNumber}).`,
      type: 'info',
      targetRole: 'ALL',
      link: '/admissions',
    });

    const newAccount = db.prepare('SELECT * FROM school_bank_accounts WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ message: 'School bank account registered successfully.', account: newAccount });
  } catch (err) {
    console.error('Create bank account error:', err);
    return res.status(500).json({ error: 'Failed to add school bank account.' });
  }
});

// PUT /settings/bank-accounts/:id (Accountant & Director Only)
router.put('/bank-accounts/:id', authenticateToken, requireRoles(['ACCOUNTANT', 'DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { bankName, accountNumber, accountHolder, institutionName, branch, swiftCode, currency, paymentInstructions, isPrimary, displayOrder, isActive } = req.body;

    const existing = db.prepare('SELECT * FROM school_bank_accounts WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'School bank account not found.' });
    }

    const primaryFlag = isPrimary !== undefined ? (isPrimary ? 1 : 0) : existing.is_primary;
    if (primaryFlag === 1) {
      db.prepare('UPDATE school_bank_accounts SET is_primary = 0 WHERE id != ?').run(id);
    }

    db.prepare(`
      UPDATE school_bank_accounts
      SET bank_name = ?, account_number = ?, account_holder = ?, institution_name = ?,
          branch = ?, swift_code = ?, currency = ?, payment_instructions = ?,
          is_primary = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      bankName?.trim() || existing.bank_name,
      accountNumber?.trim() || existing.account_number,
      accountHolder?.trim() || existing.account_holder,
      institutionName?.trim() || existing.institution_name,
      branch !== undefined ? branch?.trim() : existing.branch,
      swiftCode !== undefined ? swiftCode?.trim() : existing.swift_code,
      currency?.trim() || existing.currency,
      paymentInstructions !== undefined ? paymentInstructions?.trim() : existing.payment_instructions,
      primaryFlag,
      isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
      displayOrder !== undefined ? parseInt(displayOrder, 10) : existing.display_order,
      id
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'UPDATE_BANK_ACCOUNT',
      recordType: 'FINANCIAL_SETTINGS',
      recordId: id,
      details: `${req.user!.role} updated school payment account: ${bankName || existing.bank_name} (${accountNumber || existing.account_number})`,
      req,
    });

    const updated = db.prepare('SELECT * FROM school_bank_accounts WHERE id = ?').get(id);
    return res.json({ message: 'School bank account updated successfully.', account: updated });
  } catch (err) {
    console.error('Update bank account error:', err);
    return res.status(500).json({ error: 'Failed to update bank account.' });
  }
});

// PUT /settings/bank-accounts/:id/toggle (Accountant & Director Only)
router.put('/bank-accounts/:id/toggle', authenticateToken, requireRoles(['ACCOUNTANT', 'DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM school_bank_accounts WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'School bank account not found.' });
    }

    const newStatus = existing.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE school_bank_accounts SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: newStatus === 1 ? 'ACTIVATE_BANK_ACCOUNT' : 'DEACTIVATE_BANK_ACCOUNT',
      recordType: 'FINANCIAL_SETTINGS',
      recordId: id,
      details: `${req.user!.role} changed bank account ${existing.bank_name} (${existing.account_number}) visibility to ${newStatus === 1 ? 'ACTIVE' : 'DISABLED'}`,
      req,
    });

    return res.json({
      message: `Account is now ${newStatus === 1 ? 'active on the public payment page' : 'disabled and hidden from parents'}.`,
      isActive: newStatus === 1
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle bank account status.' });
  }
});

// DELETE /settings/bank-accounts/:id (Accountant & Director Only)
router.delete('/bank-accounts/:id', authenticateToken, requireRoles(['ACCOUNTANT', 'DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM school_bank_accounts WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'School bank account not found.' });
    }

    db.prepare('DELETE FROM school_bank_accounts WHERE id = ?').run(id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'DELETE_BANK_ACCOUNT',
      recordType: 'FINANCIAL_SETTINGS',
      recordId: id,
      details: `${req.user!.role} removed school payment account: ${existing.bank_name} (${existing.account_number})`,
      req,
    });

    return res.json({ message: 'School bank account deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete bank account.' });
  }
});

export default router;
