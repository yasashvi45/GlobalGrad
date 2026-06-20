import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { ResetPassword } from '@/pages/ResetPassword';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { AICounselor } from '@/pages/dashboard/AICounselor';
import { Countries } from '@/pages/dashboard/Countries';
import { CountryDetails } from '@/pages/dashboard/CountryDetails';
import { CompareCountries } from '@/pages/dashboard/CompareCountries';
import { Universities } from '@/pages/dashboard/Universities';
import { UniversityProfile } from '@/pages/dashboard/UniversityProfile';
import { CompareUniversities } from '@/pages/dashboard/CompareUniversities';
import { SavedItems } from '@/pages/dashboard/SavedItems';
import { useEffect } from 'react';
import { getTable, deleteFromTable } from '@/lib/api';

function CleanupWrapper({children}: {children:any}) {
  useEffect(() => {
    async function cleanup() {
      try {
        const unis = await getTable('universities');
        for (const u of unis) {
          const name = (u.name || "").toLowerCase();
          if (name.includes('test') || name.includes('demo') || name.includes('sample') || name.includes('temp')) {
            console.log('Cleanup removing dummy uni:', name);
            await deleteFromTable('universities', u.id);
          }
        }
      } catch(e) { }
    }
    cleanup();
  }, []);
  return children;
}

import { Tracker } from '@/pages/dashboard/Tracker';
import { BudgetPlanner } from '@/pages/dashboard/Budget';
import { Scholarships } from '@/pages/dashboard/Scholarships';
import { ScholarshipDetails } from '@/pages/dashboard/ScholarshipDetails';
import { CompareScholarships } from '@/pages/dashboard/CompareScholarships';
import { Documents } from '@/pages/dashboard/Documents';
import { Profile } from '@/pages/dashboard/Profile';
import { Settings } from '@/pages/dashboard/Settings';
import { Billing } from '@/pages/dashboard/Billing';
import { Premium } from '@/pages/dashboard/Premium';
import { Support } from '@/pages/dashboard/Support';
import { Messages } from '@/pages/dashboard/Messages';
import { Notifications } from '@/pages/dashboard/Notifications';

import { Calendar } from '@/pages/dashboard/Calendar';
import { Roadmap } from '@/pages/dashboard/Roadmap';
import { Analytics } from '@/pages/dashboard/Analytics';
import { Activity } from '@/pages/dashboard/Activity';

import AdminLayout from '@/components/layout/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCountries from '@/pages/admin/AdminCountries';
import AdminUniversities from '@/pages/admin/AdminUniversities';
import AdminScholarships from '@/pages/admin/AdminScholarships';
import AdminApplications from '@/pages/admin/AdminApplications';
import AdminDocuments from '@/pages/admin/AdminDocuments';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminAI from '@/pages/admin/AdminAI';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSettings from '@/pages/admin/AdminSettings';

import { AuthProvider } from '@/contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <CleanupWrapper>
        <BrowserRouter>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        
        {/* Admin Portal Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="countries" element={<AdminCountries />} />
          <Route path="universities" element={<AdminUniversities />} />
          <Route path="scholarships" element={<AdminScholarships />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="ai" element={<AdminAI />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ai-counselor" element={<AICounselor />} />
          <Route path="countries" element={<Countries />} />
          <Route path="countries/:id" element={<CountryDetails />} />
          <Route path="compare-countries" element={<CompareCountries />} />
          <Route path="universities" element={<Universities />} />
          <Route path="universities/:id" element={<UniversityProfile />} />
          <Route path="compare-universities" element={<CompareUniversities />} />
          <Route path="saved" element={<SavedItems />} />
          <Route path="applications" element={<Tracker />} />
          <Route path="budget" element={<BudgetPlanner />} />
          <Route path="scholarships" element={<Scholarships />} />
          <Route path="scholarships/:id" element={<ScholarshipDetails />} />
          <Route path="compare-scholarships" element={<CompareScholarships />} />
          <Route path="documents" element={<Documents />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="premium" element={<Premium />} />
          <Route path="billing" element={<Billing />} />
          <Route path="support" element={<Support />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activity" element={<Activity />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </CleanupWrapper>
  </AuthProvider>
  );
}
