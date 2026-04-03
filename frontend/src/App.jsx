import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/farmer/Dashboard';
import FarmerAnimals from './pages/farmer/Animals';
import FarmerHeatDetection from './pages/farmer/HeatDetection';
import FarmerInfectionDetection from './pages/farmer/InfectionDetection';
import FarmerAppointments from './pages/farmer/Appointments';
import MilkTracker from './pages/farmer/MilkTracker';
import Vaccination from './pages/farmer/Vaccination';
import AnimalHistory from './pages/farmer/AnimalHistory';
import FarmerAnalytics from './pages/farmer/Analytics';
import CentreDashboard from './pages/centre/Dashboard';
import CentreAppointments from './pages/centre/Appointments';
import CentreAlerts from './pages/centre/Alerts';
import CentreAnalytics from './pages/centre/Analytics';
import CentreReports from './pages/centre/Reports';
import Layout from './components/Layout';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'farmer'
    ? <Navigate to="/farmer/dashboard" replace />
    : <Navigate to="/centre/dashboard" replace />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RoleRedirect />} />

            <Route path="/farmer" element={<ProtectedRoute role="farmer"><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<FarmerDashboard />} />
              <Route path="animals" element={<FarmerAnimals />} />
              <Route path="heat-detection" element={<FarmerHeatDetection />} />
              <Route path="infection-detection" element={<FarmerInfectionDetection />} />
              <Route path="appointments" element={<FarmerAppointments />} />
              <Route path="milk-tracker" element={<MilkTracker />} />
              <Route path="vaccination" element={<Vaccination />} />
              <Route path="history" element={<AnimalHistory />} />
              <Route path="analytics" element={<FarmerAnalytics />} />
            </Route>

            <Route path="/centre" element={<ProtectedRoute role="ai_centre"><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<CentreDashboard />} />
              <Route path="appointments" element={<CentreAppointments />} />
              <Route path="alerts" element={<CentreAlerts />} />
              <Route path="analytics" element={<CentreAnalytics />} />
              <Route path="reports" element={<CentreReports />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
