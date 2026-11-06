import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbPath = path.join(DB_DIR, 'ibb_school.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Staff Accounts Table
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('DIRECTOR', 'ACCOUNTANT', 'ANIMATOR')),
      position TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      permitted_modules TEXT DEFAULT 'all',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Login Security & Lockout Table (3 failed attempts -> 2 minute lockout)
    CREATE TABLE IF NOT EXISTS login_security (
      identifier TEXT PRIMARY KEY,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until DATETIME,
      last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Academic Settings & Admission Rules Table
    CREATE TABLE IF NOT EXISTS academic_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      min_admission_marks REAL NOT NULL DEFAULT 60.0,
      boarding_threshold REAL NOT NULL DEFAULT 80.0,
      auto_reject_below_min INTEGER NOT NULL DEFAULT 0,
      academic_year TEXT NOT NULL DEFAULT '2026-2027',
      is_admission_open INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Stock Schedule Configuration Table (Africa/Kigali)
    CREATE TABLE IF NOT EXISTS stock_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL, -- e.g. '06:00'
      end_time TEXT NOT NULL,   -- e.g. '08:00'
      is_active INTEGER NOT NULL DEFAULT 1,
      days_of_week TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      updated_by INTEGER,
      updated_by_name TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Suppliers Table
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      category TEXT DEFAULT 'Food & Provisions',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Food Products Table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL DEFAULT 'Grains & Cereals',
      unit TEXT NOT NULL, -- kg, liters, bags, bundles
      min_stock_alert REAL NOT NULL DEFAULT 50.0,
      current_stock REAL NOT NULL DEFAULT 0.0,
      avg_unit_cost REAL NOT NULL DEFAULT 0.0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Stock In Transactions Table (Accountant)
    CREATE TABLE IF NOT EXISTS stock_in (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      supplier_id INTEGER NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0),
      unit TEXT NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0.0,
      total_cost REAL NOT NULL DEFAULT 0.0,
      transaction_date TEXT NOT NULL,
      notes TEXT,
      recorded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (recorded_by) REFERENCES staff(id)
    );

    -- Stock Out Transactions Table (Animator)
    CREATE TABLE IF NOT EXISTS stock_out (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0),
      unit TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      transaction_time TEXT NOT NULL,
      notes TEXT,
      is_emergency_override INTEGER NOT NULL DEFAULT 0,
      override_reason TEXT,
      issued_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (issued_by) REFERENCES staff(id)
    );

    -- Student Applications / Admissions Table
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('Male', 'Female')),
      father_name TEXT NOT NULL,
      mother_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      residence TEXT NOT NULL,
      previous_school TEXT NOT NULL,
      academic_level TEXT NOT NULL CHECK(academic_level IN ('L3', 'L4', 'L5')),
      department TEXT NOT NULL CHECK(department IN ('Software Development', 'Automobile Technology')),
      s3_marks REAL NOT NULL,
      qualifies_boarding INTEGER NOT NULL DEFAULT 0,
      result_slip_url TEXT,
      passport_photo_url TEXT,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Under Review', 'Approved', 'Rejected')),
      decision_reason TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reviewed_by) REFERENCES staff(id)
    );

    -- Contact Messages Table
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT UNIQUE NOT NULL,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      sender_phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New', 'Read', 'Replied', 'Closed')),
      replied_by INTEGER,
      reply_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (replied_by) REFERENCES staff(id)
    );

    -- Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'alert')),
      target_role TEXT DEFAULT 'ALL', -- 'DIRECTOR', 'ACCOUNTANT', 'ANIMATOR', 'ALL'
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Payment Notices Table (Director-managed Parent Payment Notice)
    CREATE TABLE IF NOT EXISTS payment_notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT 'Parent Payment Notice & School Fees Guidelines',
      description TEXT,
      image_url TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      bank_name TEXT DEFAULT 'Bank of Kigali (BK)',
      account_number TEXT DEFAULT '00040-0694231-89',
      account_name TEXT DEFAULT 'Institut Baptiste de Buberuka (IBB)',
      academic_year TEXT DEFAULT '2026-2027',
      uploaded_by INTEGER,
      uploaded_by_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES staff(id)
    );

    -- School Bank Accounts Table (Accountant-managed)
    CREATE TABLE IF NOT EXISTS school_bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_holder TEXT NOT NULL DEFAULT 'Institut Baptiste de Buberuka (IBB)',
      institution_name TEXT NOT NULL DEFAULT 'Institut Baptiste de Buberuka (IBB)',
      branch TEXT,
      swift_code TEXT,
      currency TEXT DEFAULT 'RWF',
      payment_instructions TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_by_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES staff(id)
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
    CREATE INDEX IF NOT EXISTS idx_applications_tracking ON applications(tracking_number);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_stock_in_prod ON stock_in(product_id);
    CREATE INDEX IF NOT EXISTS idx_stock_out_prod ON stock_out(product_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON school_bank_accounts(is_active);
  `);

  try {
    db.prepare('ALTER TABLE stock_schedules ADD COLUMN updated_by INTEGER').run();
  } catch {}
  try {
    db.prepare('ALTER TABLE stock_schedules ADD COLUMN updated_by_name TEXT').run();
  } catch {}
  try {
    db.prepare('ALTER TABLE stock_schedules ADD COLUMN updated_at DATETIME').run();
  } catch {}
  try {
    db.prepare("ALTER TABLE payment_notices ADD COLUMN academic_year TEXT DEFAULT '2026-2027'").run();
  } catch {}

  // Products reference quantity migration (for stock remaining percentage baseline)
  try {
    db.prepare('ALTER TABLE products ADD COLUMN reference_quantity REAL').run();
  } catch {}

  // Backfill if empty
  try {
    db.prepare("UPDATE stock_schedules SET updated_by = 2, updated_by_name = 'Uwimana Claire (Chief Accountant)' WHERE updated_by_name IS NULL").run();
  } catch {}

  // Backfill verified reference quantities for standard food staples
  try {
    db.prepare("UPDATE products SET reference_quantity = 1000.0 WHERE name LIKE '%Rice%' AND (reference_quantity IS NULL OR reference_quantity = 0)").run();
    db.prepare("UPDATE products SET reference_quantity = 1500.0 WHERE name LIKE '%Maize%' AND (reference_quantity IS NULL OR reference_quantity = 0)").run();
    db.prepare("UPDATE products SET reference_quantity = 300.0 WHERE name LIKE '%Oil%' AND (reference_quantity IS NULL OR reference_quantity = 0)").run();
    db.prepare("UPDATE products SET reference_quantity = 400.0 WHERE name LIKE '%Cabbage%' AND (reference_quantity IS NULL OR reference_quantity = 0)").run();
    db.prepare("UPDATE products SET reference_quantity = 1200.0 WHERE name LIKE '%Potatoes%' AND (reference_quantity IS NULL OR reference_quantity = 0)").run();
    db.prepare("UPDATE products SET reference_quantity = 400.0 WHERE name LIKE '%Sugar%' AND (reference_quantity IS NULL OR reference_quantity = 0)").run();
    db.prepare("UPDATE products SET reference_quantity = 200.0 WHERE name LIKE '%Salt%' AND (reference_quantity IS NULL OR reference_quantity = 0)").run();
    db.prepare("UPDATE products SET reference_quantity = 1600.0 WHERE name LIKE '%Beans%' AND (reference_quantity IS NULL OR reference_quantity = 0)").run();
    // For any custom products without baseline, set reference_quantity = current_stock
    db.prepare("UPDATE products SET reference_quantity = current_stock WHERE (reference_quantity IS NULL OR reference_quantity = 0) AND current_stock > 0").run();
  } catch {}

  seedDefaultData();
}

function seedDefaultData() {
  // Check if staff already exists
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get() as { count: number };
  if (staffCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const directorHash = bcrypt.hashSync('Director@2026!', salt);
    const accountantHash = bcrypt.hashSync('Accountant@2026!', salt);
    const animatorHash = bcrypt.hashSync('Animator@2026!', salt);

    const insertStaff = db.prepare(`
      INSERT INTO staff (email, password_hash, full_name, role, position, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertStaff.run(
      'director@ibb.ac.rw',
      directorHash,
      'Rev. Habimana Celestin',
      'DIRECTOR',
      'School Director',
      '+250 788 123 456',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'
    );

    insertStaff.run(
      'accountant@ibb.ac.rw',
      accountantHash,
      'Uwimana Claire',
      'ACCOUNTANT',
      'Chief Accountant',
      '+250 788 234 567',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
    );

    insertStaff.run(
      'animator@ibb.ac.rw',
      animatorHash,
      'Mugisha Patrick',
      'ANIMATOR',
      'Discipline & Stock Animator',
      '+250 788 345 678',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'
    );

    // Also add animatrice for complete staff showcase
    const animatriceHash = bcrypt.hashSync('Animatrice@2026!', salt);
    insertStaff.run(
      'animatrice@ibb.ac.rw',
      animatriceHash,
      'Mukamana Angelique',
      'ANIMATOR',
      'Animatrice & Boarding Supervisor',
      '+250 788 456 789',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80'
    );
  }

  // Check academic settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM academic_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO academic_settings (min_admission_marks, boarding_threshold, auto_reject_below_min, academic_year, is_admission_open)
      VALUES (55.0, 80.0, 0, '2026-2027', 1)
    `).run();
  }

  // Check stock schedule (06:00 - 08:00 morning slot + 17:00 - 18:30 evening slot)
  const scheduleCount = db.prepare('SELECT COUNT(*) as count FROM stock_schedules').get() as { count: number };
  if (scheduleCount.count === 0) {
    const insertSchedule = db.prepare(`
      INSERT INTO stock_schedules (name, start_time, end_time, is_active, days_of_week)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertSchedule.run('Morning Kitchen Supply', '06:00', '08:00', 1, 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
    insertSchedule.run('Evening Dinner Supply', '17:00', '18:30', 1, 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
  }

  // Check products
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (name, category, unit, min_stock_alert, current_stock, avg_unit_cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertProd.run('Rice (Tanzanian Super)', 'Grains & Cereals', 'kg', 100.0, 850.0, 1400.0);
    insertProd.run('Maize Flour (Kawunga Grade 1)', 'Flour & Grains', 'kg', 150.0, 1200.0, 850.0);
    insertProd.run('Cooking Oil (Pure Vegetable)', 'Oils & Fats', 'liters', 40.0, 240.0, 3200.0);
    insertProd.run('Cabbage (Fresh Harvest)', 'Vegetables', 'kg', 60.0, 320.0, 450.0);
    insertProd.run('Sweet Potatoes (Kinigi)', 'Tubers & Roots', 'kg', 200.0, 950.0, 380.0);
    insertProd.run('Sugar (Refined White)', 'Sweeteners', 'kg', 50.0, 300.0, 1850.0);
    insertProd.run('Salt (Iodized Table)', 'Seasonings', 'kg', 25.0, 140.0, 500.0);
    insertProd.run('Dry Beans (Colta Red)', 'Legumes & Pulses', 'kg', 150.0, 1450.0, 1100.0);
  }

  // Check suppliers
  const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as { count: number };
  if (supplierCount.count === 0) {
    const insertSupp = db.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, email, address, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertSupp.run('Buberuka Farmers Cooperative', 'Karekezi Jean', '+250 788 654 321', 'info@buberukacoop.rw', 'Buberuka District, Northern Province', 'Agricultural Produce');
    insertSupp.run('Kigali Food Distributors Ltd', 'Nkurunziza Eric', '+250 788 789 012', 'sales@kigalifoods.rw', 'Nyarugenge, Kigali', 'Packaged & Dry Groceries');
    insertSupp.run('Musanze Milling Enterprise', 'Mukeshimana Sarah', '+250 788 901 234', 'orders@musanzemills.rw', 'Musanze Town, Rwanda', 'Grain Milling & Flour');
  }

  // Check initial Stock In transactions if none
  const stockInCount = db.prepare('SELECT COUNT(*) as count FROM stock_in').get() as { count: number };
  if (stockInCount.count === 0) {
    const insertStockIn = db.prepare(`
      INSERT INTO stock_in (product_id, supplier_id, quantity, unit, unit_cost, total_cost, transaction_date, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStockIn.run(1, 2, 1000.0, 'kg', 1400.0, 1400000.0, '2026-10-25', 'Term 1 Bulk Procurement', 2);
    insertStockIn.run(2, 3, 1500.0, 'kg', 850.0, 1275000.0, '2026-10-26', 'Fresh Grade 1 Kawunga delivery', 2);
    insertStockIn.run(3, 2, 300.0, 'liters', 3200.0, 960000.0, '2026-10-27', '20L Jerricans batch', 2);
    insertStockIn.run(8, 1, 1600.0, 'kg', 1100.0, 1760000.0, '2026-10-28', 'Direct from local farmers cooperative', 2);
  }

  // Check initial Stock Out transactions
  const stockOutCount = db.prepare('SELECT COUNT(*) as count FROM stock_out').get() as { count: number };
  if (stockOutCount.count === 0) {
    const insertStockOut = db.prepare(`
      INSERT INTO stock_out (product_id, quantity, unit, transaction_date, transaction_time, notes, issued_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertStockOut.run(1, 150.0, 'kg', '2026-11-01', '06:30', 'Breakfast & Lunch preparation', 3);
    insertStockOut.run(2, 300.0, 'kg', '2026-11-01', '07:15', 'Daily Kawunga for boarding students', 3);
    insertStockOut.run(3, 60.0, 'liters', '2026-11-01', '07:30', 'Cooking oil for kitchen staff', 3);
    insertStockOut.run(8, 150.0, 'kg', '2026-11-01', '07:45', 'Beans stew for student meals', 3);
  }

  // Check applications if none
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  if (appCount.count === 0) {
    const insertApp = db.prepare(`
      INSERT INTO applications (
        tracking_number, student_name, date_of_birth, gender, father_name, mother_name,
        phone, email, residence, previous_school, academic_level, department,
        s3_marks, qualifies_boarding, status, decision_reason, reviewed_by, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertApp.run(
      'IBB-2026-0001',
      'Manzi Kevin',
      '2009-04-12',
      'Male',
      'Gatete Alphonse',
      'Nyiranziza Marie',
      '+250 788 111 222',
      'kevinmanzi@gmail.com',
      'Musanze, Busogo',
      'GS Nyakinama',
      'L3',
      'Software Development',
      84.5,
      1,
      'Approved',
      'Exemplary S3 national exam performance in Mathematics and Physics.',
      1,
      '2026-10-28 10:30:00'
    );

    insertApp.run(
      'IBB-2026-0002',
      'Ineza Divine',
      '2009-08-20',
      'Female',
      'Bizimana Claude',
      'Mukarugwiza Jeanne',
      '+250 788 333 444',
      'divineineza@gmail.com',
      'Gicumbi, Byumba',
      'GS De La Salle Byumba',
      'L3',
      'Automobile Technology',
      78.0,
      0,
      'Approved',
      'Meets all academic criteria for automotive engineering department.',
      1,
      '2026-10-29 14:15:00'
    );

    insertApp.run(
      'IBB-2026-0003',
      'Kwizera Emmanuel',
      '2008-11-05',
      'Male',
      'Rutayisire Jean',
      'Uwamahoro Esperance',
      '+250 788 555 666',
      'emmanuel.kwizera@gmail.com',
      'Rulindo, Bushoki',
      'ES Buberuka',
      'L4',
      'Software Development',
      62.0,
      0,
      'Under Review',
      null,
      null,
      null
    );

    insertApp.run(
      'IBB-2026-0004',
      'Umutoni Grace',
      '2009-02-18',
      'Female',
      'Kagame Emmanuel',
      'Mukankusi Beatrice',
      '+250 788 777 888',
      'umutoni.grace@gmail.com',
      'Burera, Cyanika',
      'GS Cyanika',
      'L3',
      'Software Development',
      88.0,
      1,
      'Pending',
      null,
      null,
      null
    );
  }

  // Check initial contact messages
  const msgCount = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get() as { count: number };
  if (msgCount.count === 0) {
    const insertMsg = db.prepare(`
      INSERT INTO contact_messages (reference_number, sender_name, sender_email, sender_phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertMsg.run(
      'MSG-2026-0001',
      'Hakizimana Jean Bosco',
      'jbosco.hakizi@gmail.com',
      '+250 788 999 111',
      'Inquiry Regarding L3 Boarding Facilities & Requirements',
      'Muraho, I am the parent of a student who scored 86% in S3. I would like to inquire about boarding accommodation and required items for the 2026-2027 academic term. Thank you.',
      'New'
    );

    insertMsg.run(
      'MSG-2026-0002',
      'Dusabe Sandrine',
      'sandrine.dusabe@outlook.com',
      '+250 788 222 333',
      'Partnership with Automobile Technology Workshop',
      'Good day Director, Our garage network in Musanze is interested in offering internship placements for IBB L5 Automobile Technology graduates. Let us arrange a formal meeting.',
      'Read'
    );
  }

  // Check initial notifications
  const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get() as { count: number };
  if (notifCount.count === 0) {
    const insertNotif = db.prepare(`
      INSERT INTO notifications (title, message, type, target_role, link)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertNotif.run('New Admission Application', 'Umutoni Grace applied for L3 Software Development with S3 marks 88.0%.', 'info', 'DIRECTOR', '/dashboard/director/admissions');
    insertNotif.run('Stock Level Nominal', 'All 8 food product reserves are currently above minimum threshold.', 'success', 'ACCOUNTANT', '/dashboard/accountant/inventory');
    insertNotif.run('Stock Working Window Active', 'Morning kitchen issuing period 06:00 - 08:00 is active.', 'info', 'ANIMATOR', '/dashboard/animator/stock-out');
  }

  // Seed initial audit log
  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number };
  if (auditCount.count === 0) {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, record_type, record_id, details)
      VALUES (1, 'Rev. Habimana Celestin', 'DIRECTOR', 'SYSTEM_INITIALIZATION', 'SYSTEM', '1', 'IBB School Management Database initialized successfully with default security parameters.')
    `).run();
  }

  // Check initial parent payment notice
  const noticeCount = db.prepare('SELECT COUNT(*) as count FROM payment_notices').get() as { count: number };
  if (noticeCount.count === 0) {
    db.prepare(`
      INSERT INTO payment_notices (title, description, image_url, is_active, bank_name, account_number, account_name, uploaded_by, uploaded_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Official Tuition & Boarding Fees Bank Payment Voucher (Academic Year 2026-2027)',
      'Notice for parents of admitted students: All tuition and boarding fees must be deposited directly into the official IBB bank accounts listed below. Always indicate the student tracking reference on the bank slip.',
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
      1,
      'Bank of Kigali (BK)',
      '00040-0694231-89',
      'Institut Baptiste de Buberuka (IBB)',
      1,
      'Rev. Habimana Celestin'
    );
  }

  // Check initial school bank accounts (Accountant managed)
  const bankCount = db.prepare('SELECT COUNT(*) as count FROM school_bank_accounts').get() as { count: number };
  if (bankCount.count === 0) {
    const insertAccount = db.prepare(`
      INSERT INTO school_bank_accounts (bank_name, account_number, account_holder, institution_name, branch, swift_code, currency, payment_instructions, is_primary, is_active, display_order, created_by, created_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAccount.run(
      'Bank of Kigali (BK)',
      '00040-0694231-89',
      'Institut Baptiste de Buberuka (IBB)',
      'Institut Baptiste de Buberuka (IBB)',
      'Musanze / Burera Branch',
      'BKIGRW22',
      'RWF',
      'Direct branch deposits & BK Yacu agency banking. Quote student full name & tracking number in deposit remark.',
      1,
      1,
      1,
      2,
      'Uwimana Claire (Chief Accountant)'
    );

    insertAccount.run(
      'Equity Bank Rwanda',
      '40021-0812940-12',
      'Institut Baptiste de Buberuka (IBB)',
      'Institut Baptiste de Buberuka (IBB)',
      'Musanze Branch',
      'EQBLRW22',
      'RWF',
      'Cash deposits accepted at all Equity Bank branches and authorized E-Wakil agents nationwide.',
      0,
      1,
      2,
      2,
      'Uwimana Claire (Chief Accountant)'
    );

    insertAccount.run(
      'MTN MoMo Pay Merchant',
      '*182*8*1*042189#',
      'IBB Technical School',
      'Institut Baptiste de Buberuka (IBB)',
      'Digital Merchant Payments',
      '',
      'RWF',
      'Dial *182*8*1*042189# from your MTN phone. Enter tuition amount, then input student tracking code in reference.',
      0,
      1,
      3,
      2,
      'Uwimana Claire (Chief Accountant)'
    );
  }
}
