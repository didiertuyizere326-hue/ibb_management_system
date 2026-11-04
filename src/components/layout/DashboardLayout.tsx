import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../common/Sidebar';
import { DashboardHeader } from '../common/DashboardHeader';
import { StaffRole } from '../../types';

interface DashboardLayoutProps {
  allowedRoles?: StaffRole[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0E11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FCD535] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 dark:text-[#A0AAB8] font-mono tracking-wider uppercase text-[10px]">
            Verifying secure credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to permitted root dashboard
    if (user.role === 'DIRECTOR') return <Navigate to="/dashboard/director" replace />;
    if (user.role === 'ACCOUNTANT') return <Navigate to="/dashboard/accountant/inventory" replace />;
    return <Navigate to="/dashboard/animator" replace />;
  }

  // Generate dynamic breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.slice(1).map((part) => {
    return part
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B0E11] text-[#172033] dark:text-[#F0F3F6] flex transition-colors selection:bg-[#1769FF]/20 dark:selection:bg-[#FCD535]/30">
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        
        {/* Header */}
        <DashboardHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={breadcrumbs.length > 0 ? breadcrumbs : ['Dashboard']}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
};
