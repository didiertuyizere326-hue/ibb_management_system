-- =====================================================================
-- INSTITUT BAPTISTE DE BUBERUKA (IBB) - RWANDA
-- COMPLETE PRODUCTION MYSQL RELATIONAL DATABASE SCHEMA
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS ibb_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ibb_school;

-- 1. Staff Accounts & RBAC
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('DIRECTOR', 'ACCOUNTANT', 'ANIMATOR') NOT NULL,
  position VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  permitted_modules TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_email (email),
  INDEX idx_staff_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Academic Settings & Admissions Rules
CREATE TABLE IF NOT EXISTS academic_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  min_admission_marks DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  boarding_threshold DECIMAL(5,2) NOT NULL DEFAULT 80.00,
  auto_reject_below_min TINYINT(1) NOT NULL DEFAULT 0,
  academic_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
  is_admission_open TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Stock Schedule Configuration (Africa/Kigali Timezone)
CREATE TABLE IF NOT EXISTS stock_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  days_of_week VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(150),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(191),
  address TEXT,
  category VARCHAR(100) DEFAULT 'Food & Provisions',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suppliers_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Food Inventory Products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL DEFAULT 'Grains & Cereals',
  unit VARCHAR(30) NOT NULL,
  min_stock_alert DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  avg_unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Stock In Transactions (Accountant)
CREATE TABLE IF NOT EXISTS stock_in (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  supplier_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  transaction_date DATE NOT NULL,
  notes TEXT,
  recorded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stockin_product FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE,
  CONSTRAINT fk_stockin_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON UPDATE CASCADE,
  CONSTRAINT fk_stockin_staff FOREIGN KEY (recorded_by) REFERENCES staff(id) ON UPDATE CASCADE,
  INDEX idx_stockin_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Stock Out Transactions (Animator)
CREATE TABLE IF NOT EXISTS stock_out (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_time TIME NOT NULL,
  notes TEXT,
  is_emergency_override TINYINT(1) NOT NULL DEFAULT 0,
  override_reason TEXT,
  issued_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stockout_product FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE,
  CONSTRAINT fk_stockout_staff FOREIGN KEY (issued_by) REFERENCES staff(id) ON UPDATE CASCADE,
  INDEX idx_stockout_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Student Applications / Admissions
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_number VARCHAR(60) NOT NULL UNIQUE,
  student_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('Male', 'Female') NOT NULL,
  father_name VARCHAR(255) NOT NULL,
  mother_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(191) NOT NULL,
  residence VARCHAR(255) NOT NULL,
  previous_school VARCHAR(255) NOT NULL,
  academic_level ENUM('L3', 'L4', 'L5') NOT NULL,
  department ENUM('Software Development', 'Automobile Technology') NOT NULL,
  s3_marks DECIMAL(5,2) NOT NULL,
  qualifies_boarding TINYINT(1) NOT NULL DEFAULT 0,
  result_slip_url MEDIUMTEXT,
  passport_photo_url MEDIUMTEXT,
  status ENUM('Pending', 'Under Review', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  decision_reason TEXT,
  reviewed_by INT,
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_reviewer FOREIGN KEY (reviewed_by) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_app_tracking (tracking_number),
  INDEX idx_app_status (status),
  INDEX idx_app_level_dept (academic_level, department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Contact Us Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(60) NOT NULL UNIQUE,
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(191) NOT NULL,
  sender_phone VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('New', 'Read', 'Replied', 'Closed') NOT NULL DEFAULT 'New',
  replied_by INT,
  reply_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contact_replier FOREIGN KEY (replied_by) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_contact_ref (reference_number),
  INDEX idx_contact_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  record_type VARCHAR(100) NOT NULL,
  record_id VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_time (created_at),
  INDEX idx_audit_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. System Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'alert') NOT NULL DEFAULT 'info',
  target_role VARCHAR(50) DEFAULT 'ALL',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_target (target_role, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
