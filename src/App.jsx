import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import TextAnalysis from './pages/TextAnalysis';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSetting';
import AdminReports from './pages/admin/AdminReports';
import Header from './components/Header';
import Footer from './components/Footer';
import Help from './pages/Help';
import AnalysisView from './pages/AnalysisView';  // Ensure this is imported
import Subscription from './pages/Subscription';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser || !isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

// Layout component that conditionally renders Header and Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!isAuthPage && <Header />}
      <main className={`flex-grow container mx-auto px-4 py-8 ${isAuthPage ? 'flex items-center justify-center' : ''}`}>
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

function AppContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analysis" 
          element={
            <ProtectedRoute>
              <TextAnalysis />
            </ProtectedRoute>
          } 
        />
        
        {/* Update route here */}
        <Route 
          path="/analysis/:id"  // Correct route for viewing individual submissions
          element={
            <ProtectedRoute>
              <AnalysisView />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/progress" 
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/help" 
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <AdminRoute>
              <AdminReports />
            </AdminRoute>
          } 
        />
        <Route 
          path="/subscription" 
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
