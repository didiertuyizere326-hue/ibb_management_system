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
  term_id?: number | null;
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
  event_type?: string;
  entity_name?: string | null;
  academic_year?: string | null;
  term_name?: string | null;
  actor_name?: string | null;
  meta_json?: string | null;
  created_at: string;
}

export type TermStatus = 'Upcoming' | 'Active' | 'Closed';

export interface AcademicTerm {
  id: number;
  academic_year: string;
  term_number: number;
  name: string;
  start_date: string;
  end_date: string;
  status: TermStatus;
  opening_initialized?: number;
  carried_from_term_id?: number | null;
  carried_from_year?: string | null;
  carried_from_term_name?: string | null;
  carried_forward_at?: string | null;
  closed_at?: string | null;
  closed_by?: number | null;
  closed_by_name?: string | null;
  closing_notes?: string | null;
  reopened_at?: string | null;
  reopened_by?: number | null;
  reopened_by_name?: string | null;
  reopen_reason?: string | null;
  manual_reopen?: number;
  tracked_items_count?: number;
  total_received_quantity?: number;
  total_issued_quantity?: number;
  total_procurement_spend?: number;
  created_at: string;
  updated_at?: string | null;
}

export interface YearMeta {
  academicYear: string;
  previousAcademicYear: string | null;
  openingInitialized: boolean;
  previousYearClosingReady: boolean;
  previousYearTerm3Id: number | null;
  canInitializeOpening: boolean;
}

export interface ActiveTermResponse {
  activeTerm: AcademicTerm | null;
  kigaliDate: string;
  kigaliTime: string;
  currentAcademicYear: string;
}

export interface TermStockItem {
  id: number;
  term_id: number;
  product_id: number;
  product_name: string;
  category: string;
  unit: string;
  opening_stock: number;
  received_quantity: number;
  issued_quantity: number;
  closing_stock: number;
  unit_cost: number | null;
  has_unit_cost?: boolean;
  stock_in_value?: number | null;
  stock_out_value?: number | null;
  closing_value?: number | null;
  total_value: number;
  min_stock_alert: number;
  is_locked: number;
  notes?: string | null;
  stock_status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface TermFinancialSummary {
  totalStockInValue: number | null;
  totalStockOutValue: number | null;
  totalClosingValue: number | null;
  hasUnpricedStockIn: boolean;
  hasUnpricedStockOut: boolean;
  hasUnpricedClosing: boolean;
  missingCostProducts: string[];
  valuationStatus: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE';
}

export interface TermDetailResponse {
  term: AcademicTerm;
  items: TermStockItem[];
  summary?: {
    totalProducts: number;
    totalOpeningQuantity: number;
    totalReceivedQuantity: number;
    totalIssuedQuantity: number;
    totalClosingQuantity: number;
    totalValuation: number | null;
    normalCount?: number;
    lowStockCount?: number;
    outOfStockCount?: number;
  };
  financialSummary?: TermFinancialSummary;
  transactions: {
    stock_in: any[];
    stock_out: any[];
  };
}
