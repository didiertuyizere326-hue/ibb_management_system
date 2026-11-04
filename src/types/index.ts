export type StaffRole = 'DIRECTOR' | 'ACCOUNTANT' | 'ANIMATOR';

export interface Staff {
  id: number;
  email: string;
  full_name: string;
  role: StaffRole;
  position: string;
  phone?: string;
  avatar_url?: string;
  is_active: number;
  permitted_modules?: string;
  created_at: string;
  updated_at?: string;
}

export interface AcademicSettings {
  id: number;
  min_admission_marks: number;
  boarding_threshold: number;
  auto_reject_below_min: number;
  academic_year: string;
  is_admission_open: number;
  updated_at: string;
}

export interface StockSchedule {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: number;
  days_of_week: string;
  created_at: string;
  updated_by?: number | null;
  updated_by_name?: string | null;
  updated_at?: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  category: string;
  is_active: number;
  total_deliveries?: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  min_stock_alert: number;
  current_stock: number;
  reference_quantity?: number;
  remaining_percentage?: number;
  stock_status?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  avg_unit_cost: number;
  total_value?: number;
  is_low_stock?: number;
  is_active: number;
  created_at: string;
}

export interface StockOverviewItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  reference_quantity: number;
  remaining_percentage: number;
  min_stock_alert: number;
  stock_status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  avg_unit_cost?: number;
  total_value?: number;
}

export interface PaymentNotice {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  is_active: number;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  academic_year?: string;
  uploaded_by?: number;
  uploaded_by_name?: string;
  author_name?: string;
  author_position?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolBankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  institution_name: string;
  branch?: string;
  swift_code?: string;
  currency: string;
  payment_instructions?: string;
  is_primary: number;
  is_active: number;
  display_order: number;
  created_by?: number;
  creator_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockInTransaction {
  id: number;
  product_id: number;
  product_name?: string;
  supplier_id: number;
  supplier_name?: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  transaction_date: string;
  notes?: string;
  recorded_by: number;
  recorded_by_name?: string;
  created_at: string;
}

export interface StockOutTransaction {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit: string;
  transaction_date: string;
  transaction_time: string;
  notes?: string;
  is_emergency_override: number;
  override_reason?: string;
  issued_by: number;
  issued_by_name?: string;
  created_at: string;
}

export type ApplicationStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export interface Application {
  id: number;
  tracking_number: string;
  student_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female';
  father_name: string;
  mother_name: string;
  phone: string;
  email: string;
  residence: string;
  previous_school: string;
  academic_level: 'L3' | 'L4' | 'L5';
  department: 'Software Development' | 'Automobile Technology';
  s3_marks: number;
  qualifies_boarding: number;
  result_slip_url?: string;
  passport_photo_url?: string;
  status: ApplicationStatus;
  decision_reason?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  reference_number: string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  subject: string;
  message: string;
  status: 'New' | 'Read' | 'Replied' | 'Closed';
  replied_by?: number;
  replied_by_name?: string;
  reply_notes?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_role?: string;
  action: string;
  record_type: string;
  record_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  target_role: string;
  is_read: number;
  link?: string;
  created_at: string;
}

export interface ScheduleStatus {
  isPermitted: boolean;
  kigaliTime: string;
  activeScheduleName?: string;
  reason: string;
  nextOpeningTime?: string;
  configuredSchedules?: StockSchedule[];
}
