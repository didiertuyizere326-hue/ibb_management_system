import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { ProgramsPage } from './pages/public/ProgramsPage';
import { AdmissionsPage } from './pages/public/AdmissionsPage';
import { TrackApplicationPage } from './pages/public/TrackApplicationPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/public/LoginPage';

// Dashboard Pages
import { DirectorOverview } from './pages/dashboard/DirectorOverview';
import { DirectorAdmissions } from './pages/dashboard/DirectorAdmissions';
import { ApprovedStudentsPage } from './pages/dashboard/ApprovedStudentsPage';
import { AcademicSettingsPage } from './pages/dashboard/AcademicSettingsPage';
import { FoodInventoryPage } from './pages/dashboard/FoodInventoryPage';
import { StockSchedulesPage } from './pages/dashboard/StockSchedulesPage';
import { SuppliersPage } from './pages/dashboard/SuppliersPage';
import { StaffAccountsPage } from './pages/dashboard/StaffAccountsPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { AuditLogsPage } from './pages/dashboard/AuditLogsPage';
import { MessagesInboxPage } from './pages/dashboard/MessagesInboxPage';
import { StockInPage } from './pages/dashboard/StockInPage';
import { StockOutPage } from './pages/dashboard/StockOutPage';
import { TransactionsLedgerPage } from './pages/dashboard/TransactionsLedgerPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { SchoolBankAccountsPage } from './pages/dashboard/SchoolBankAccountsPage';

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              
              {/* ========================================= */}
              {/* PUBLIC SCHOOL WEBSITE ROUTES */}
              {/* ========================================= */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/programs" element={<ProgramsPage />} />
                <Route path="/admissions" element={<AdmissionsPage />} />
                <Route path="/track" element={<TrackApplicationPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* Secure Staff Login */}
              <Route path="/login" element={<LoginPage />} />

              {/* ========================================= */}
              {/* DIRECTOR DASHBOARD ROUTES (SUPER ADMIN) */}
              {/* ========================================= */}
              <Route path="/dashboard/director" element={<DashboardLayout allowedRoles={['DIRECTOR']} />}>
                <Route index element={<DirectorOverview />} />
                <Route path="admissions" element={<DirectorAdmissions />} />
                <Route path="approved-students" element={<ApprovedStudentsPage />} />
                <Route path="academic-settings" element={<AcademicSettingsPage />} />
                <Route path="bank-accounts" element={<SchoolBankAccountsPage />} />
                <Route path="inventory" element={<FoodInventoryPage />} />
                <Route path="schedules" element={<StockSchedulesPage />} />
                <Route path="suppliers" element={<SuppliersPage />} />
                <Route path="staff" element={<StaffAccountsPage />} />
                <Route path="access-control" element={<StaffAccountsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit" element={<AuditLogsPage />} />
                <Route path="messages" element={<MessagesInboxPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* ========================================= */}
              {/* ACCOUNTANT DASHBOARD ROUTES */}
              {/* ========================================= */}
              <Route path="/dashboard/accountant" element={<DashboardLayout allowedRoles={['ACCOUNTANT', 'DIRECTOR']} />}>
                <Route index element={<Navigate to="/dashboard/accountant/inventory" replace />} />
                <Route path="inventory" element={<FoodInventoryPage />} />
                <Route path="stock-in" element={<StockInPage />} />
                <Route path="transactions" element={<TransactionsLedgerPage />} />
                <Route path="bank-accounts" element={<SchoolBankAccountsPage />} />
                <Route path="suppliers" element={<SuppliersPage />} />
                <Route path="schedules" element={<StockSchedulesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="messages" element={<MessagesInboxPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* ========================================= */}
              {/* ANIMATOR DASHBOARD ROUTES */}
              {/* ========================================= */}
              <Route path="/dashboard/animator" element={<DashboardLayout allowedRoles={['ANIMATOR', 'DIRECTOR']} />}>
                <Route index element={<FoodInventoryPage />} />
                <Route path="stock-out" element={<StockOutPage />} />
                <Route path="history" element={<TransactionsLedgerPage />} />
                <Route path="messages" element={<MessagesInboxPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
