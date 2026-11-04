import { Router } from 'express';
import { db } from '../db';
import {
  authenticateToken,
  requireRoles,
  logAudit,
  createNotification,
  AuthRequest
} from '../auth';

const router = Router();

// Helper to generate unique tracking number
function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const lastApp = db.prepare(`
    SELECT tracking_number FROM applications
    WHERE tracking_number LIKE 'IBB-${year}-%'
    ORDER BY id DESC LIMIT 1
  `).get() as { tracking_number: string } | undefined;

  let seq = 1;
  if (lastApp && lastApp.tracking_number) {
    const parts = lastApp.tracking_number.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      seq = lastNum + 1;
    }
  }
  return `IBB-${year}-${String(seq).padStart(4, '0')}`;
}

// Public: Submit Application
router.post('/apply', (req, res) => {
  try {
    const {
      studentName,
      dateOfBirth,
      gender,
      fatherName,
      motherName,
      phone,
      email,
      residence,
      previousSchool,
      academicLevel,
      department,
      s3Marks,
      resultSlipUrl,
      passportPhotoUrl,
    } = req.body;

    if (!studentName || !dateOfBirth || !gender || !fatherName || !motherName || !phone || !email || !residence || !previousSchool || !academicLevel || !department || s3Marks === undefined) {
      return res.status(400).json({ error: 'Please fill in all mandatory application fields.' });
    }

    const marksNum = parseFloat(s3Marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      return res.status(400).json({ error: 'S3 marks must be a valid percentage between 0 and 100.' });
    }

    // Get current admission settings
    const settings = db.prepare('SELECT * FROM academic_settings ORDER BY id DESC LIMIT 1').get() as {
      min_admission_marks: number;
      boarding_threshold: number;
      auto_reject_below_min: number;
      is_admission_open: number;
    } | undefined;

    if (settings && settings.is_admission_open !== 1) {
      return res.status(400).json({ error: 'Admissions are currently closed for the academic session.' });
    }

    const minMarks = settings ? settings.min_admission_marks : 55.0;
    const boardingThreshold = settings ? settings.boarding_threshold : 80.0;
    const qualifiesBoarding = marksNum >= boardingThreshold ? 1 : 0;

    let initialStatus = 'Pending';
    let decisionReason: string | null = null;

    if (settings && settings.auto_reject_below_min === 1 && marksNum < minMarks) {
      initialStatus = 'Rejected';
      decisionReason = `S3 academic performance score (${marksNum}%) is below IBB institutional minimum cutoff threshold of ${minMarks}%.`;
    }

    const trackingNumber = generateTrackingNumber();

    const stmt = db.prepare(`
      INSERT INTO applications (
        tracking_number, student_name, date_of_birth, gender, father_name, mother_name,
        phone, email, residence, previous_school, academic_level, department,
        s3_marks, qualifies_boarding, result_slip_url, passport_photo_url, status, decision_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      trackingNumber,
      studentName.trim(),
      dateOfBirth,
      gender,
      fatherName.trim(),
      motherName.trim(),
      phone.trim(),
      email.trim(),
      residence.trim(),
      previousSchool.trim(),
      academicLevel,
      department,
      marksNum,
      qualifiesBoarding,
      resultSlipUrl || null,
      passportPhotoUrl || null,
      initialStatus,
      decisionReason
    );

    // Notify Director
    createNotification({
      title: 'New Student Application Submitted',
      message: `${studentName} applied for ${academicLevel} ${department} (Score: ${marksNum}%). Tracking: ${trackingNumber}`,
      type: 'info',
      targetRole: 'DIRECTOR',
      link: '/dashboard/director/admissions',
    });

    logAudit({
      action: 'APPLICATION_SUBMITTED',
      recordType: 'APPLICATION',
      recordId: trackingNumber,
      details: `New student registration: ${studentName} for ${academicLevel} ${department}`,
      req,
    });

    return res.status(201).json({
      message: 'Application submitted successfully.',
      trackingNumber,
      status: initialStatus,
      qualifiesBoarding: qualifiesBoarding === 1,
    });
  } catch (err) {
    console.error('Admission submit error:', err);
    return res.status(500).json({ error: 'Failed to process admission application.' });
  }
});

// Public: Track Application by tracking number
router.get('/track/:trackingNumber', (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const app = db.prepare(`
      SELECT
        tracking_number, student_name, academic_level, department,
        s3_marks, qualifies_boarding, status, decision_reason, reviewed_at, created_at
      FROM applications
      WHERE tracking_number = ?
    `).get(trackingNumber.trim().toUpperCase()) as {
      tracking_number: string;
      student_name: string;
      academic_level: string;
      department: string;
      s3_marks: number;
      qualifies_boarding: number;
      status: string;
      decision_reason?: string;
      reviewed_at?: string;
      created_at: string;
    } | undefined;

    if (!app) {
      return res.status(404).json({
        error: `No admission application found with tracking number "${trackingNumber}". Please check the reference code.`,
      });
    }

    return res.json({ application: app });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to query application status.' });
  }
});

// Protected (Director / Staff): List Applications with filtering
router.get('/', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { status, level, department, search } = req.query;

    let query = 'SELECT * FROM applications WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (level && level !== 'all') {
      query += ' AND academic_level = ?';
      params.push(level);
    }
    if (department && department !== 'all') {
      query += ' AND department = ?';
      params.push(department);
    }
    if (search) {
      query += ' AND (student_name LIKE ? OR tracking_number LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY id DESC';

    const applications = db.prepare(query).all(...params);
    return res.json({ applications });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load applications.' });
  }
});

// Protected: Get Approved Students Register (accessible to Director and permitted staff)
router.get('/approved', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { level, department, search } = req.query;
    let query = "SELECT * FROM applications WHERE status = 'Approved'";
    const params: any[] = [];

    if (level && level !== 'all') {
      query += ' AND academic_level = ?';
      params.push(level);
    }
    if (department && department !== 'all') {
      query += ' AND department = ?';
      params.push(department);
    }
    if (search) {
      query += ' AND (student_name LIKE ? OR tracking_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY academic_level ASC, student_name ASC';
    const approved = db.prepare(query).all(...params);

    return res.json({ students: approved });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve approved students register.' });
  }
});

// Protected: Approve / Reject Application (Director Only!)
router.put('/:id/decision', authenticateToken, requireRoles(['DIRECTOR']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;

    if (!['Approved', 'Rejected', 'Under Review'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision status.' });
    }

    if (decision === 'Rejected' && !reason) {
      return res.status(400).json({ error: 'A specific explanation or reason is required when rejecting an application.' });
    }

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as {
      id: number;
      tracking_number: string;
      student_name: string;
      academic_level: string;
      department: string;
    } | undefined;

    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    db.prepare(`
      UPDATE applications
      SET status = ?, decision_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(decision, reason || null, req.user!.id, id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: `ADMISSION_${decision.toUpperCase()}`,
      recordType: 'APPLICATION',
      recordId: app.tracking_number,
      details: `Director decided ${decision} for ${app.student_name}. Reason: ${reason || 'Criteria met'}`,
      req,
    });

    createNotification({
      title: `Admission Application ${decision}`,
      message: `${app.student_name} (${app.tracking_number}) has been marked as ${decision} by Director.`,
      type: decision === 'Approved' ? 'success' : 'alert',
      targetRole: 'DIRECTOR',
      link: '/dashboard/director/admissions',
    });

    return res.json({
      message: `Application marked as ${decision} successfully.`,
    });
  } catch (err) {
    console.error('Decision error:', err);
    return res.status(500).json({ error: 'Failed to record admission decision.' });
  }
});

export default router;
