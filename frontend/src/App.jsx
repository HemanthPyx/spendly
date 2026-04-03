import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Wishlist from './pages/Wishlist';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Savings from './pages/Savings';
import Recurring from './pages/Recurring';
import Debts from './pages/Debts';
import Settings from './pages/Settings';
import BudgetAlerts from './pages/BudgetAlerts';
import ForgotPassword from './pages/ForgotPassword';

// Replace with your Google Client ID from .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="income" element={<Income />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="savings" element={<Savings />} />
        <Route path="recurring" element={<Recurring />} />
        <Route path="debts" element={<Debts />} />
        <Route path="settings" element={<Settings />} />
        <Route path="budget-alerts" element={<BudgetAlerts />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              toastStyle={{ borderRadius: '12px' }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
