import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'

// Role-based dashboards
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import TeacherDashboard from './pages/teacher/TeacherDashboard'

// Super Admin pages
import AdminsManagement from './pages/super-admin/AdminsManagement'
import SystemSettings from './pages/super-admin/SystemSettings'
import WhatsAppSettings from './pages/super-admin/WhatsAppSettings'

// Admin pages
import TeachersManagement from './pages/admin/TeachersManagement'
import ClassesManagement from './pages/admin/ClassesManagement'
import ClassDetails from './pages/admin/ClassDetails'
import ModuleReports from './pages/admin/ModuleReports'
import OsTemplateSettings from './pages/admin/OsTemplateSettings'
import AdminWhatsAppSettings from './pages/admin/WhatsAppSettings'
import BroadcastPage from './pages/admin/BroadcastPage'

// Teacher pages
import TeacherClassPage from './pages/teacher/TeacherClassPage'
import LessonPage from './pages/teacher/LessonPage'

// Shared pages
import SettingsPage from './pages/SettingsPage'

// Public pages
import ParentPage from './pages/ParentPage'
import LandingPage from './pages/LandingPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/parent/:token" element={<ParentPage />} />
            
            {/* ==================== SUPER ADMIN ROUTES ==================== */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/admins"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/settings"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <SystemSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/whatsapp"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <WhatsAppSettings />
                </ProtectedRoute>
              }
            />
            
            {/* ==================== ADMIN ROUTES ==================== */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <TeachersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ClassesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ClassDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports/:moduleId"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ModuleReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/os-template"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <OsTemplateSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/whatsapp"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminWhatsAppSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/broadcast"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <BroadcastPage />
                </ProtectedRoute>
              }
            />
            
            {/* ==================== TEACHER ROUTES ==================== */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes/:id"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <TeacherClassPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/lessons/:lessonId"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <LessonPage />
                </ProtectedRoute>
              }
            />
            
            {/* ==================== SHARED ROUTES ==================== */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            
            {/* ==================== LEGACY ROUTES (redirect) ==================== */}
            <Route path="/dashboard" element={<RoleBasedRedirect />} />
            <Route path="/classes/:id" element={<Navigate to="/teacher" replace />} />
            
            {/* ==================== PUBLIC ROUTES ==================== */}
            <Route path="/" element={<LandingPage />} />
            
            {/* ==================== DEFAULT REDIRECT ==================== */}
            <Route path="/home" element={<RoleBasedRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Redirect based on user role
function RoleBasedRedirect() {
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    return <Navigate to="/login" replace />
  }
  
  try {
    const user = JSON.parse(userStr)
    switch (user.role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/super-admin" replace />
      case 'ADMIN':
        return <Navigate to="/admin" replace />
      case 'TEACHER':
        return <Navigate to="/teacher" replace />
      default:
        return <Navigate to="/login" replace />
    }
  } catch {
    return <Navigate to="/login" replace />
  }
}

export default App
