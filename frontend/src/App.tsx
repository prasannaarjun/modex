import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShowsProvider } from './contexts/ShowsContext';
import { BookingProvider } from './contexts/BookingContext';
import { Header } from './components/Header';
import { ShowsList } from './pages/ShowsList.tsx';
import { Auth } from './pages/Auth.tsx';
import { Admin } from './pages/Admin.tsx';
import { Booking } from './pages/Booking.tsx';
import { BookingDetails } from './pages/BookingDetails.tsx';
import { MyBookings } from './pages/MyBookings.tsx';

const PrivateRoute = ({ children, adminOnly = false }: { children: ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div className="p-10 text-center">Loading auth...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ShowsList />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />

      <Route path="/admin" element={
        <PrivateRoute adminOnly>
          <Admin />
        </PrivateRoute>
      } />

      <Route path="/booking/:id" element={
        <PrivateRoute>
          <Booking />
        </PrivateRoute>
      } />

      <Route path="/bookings/:id" element={
        <PrivateRoute>
          <BookingDetails />
        </PrivateRoute>
      } />

      <Route path="/my-bookings" element={
        <PrivateRoute>
          <MyBookings />
        </PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ShowsProvider>
        <BookingProvider>
          <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4">
              <AppRoutes />
            </main>
            <Toaster position="top-right" />
          </div>
        </BookingProvider>
      </ShowsProvider>
    </AuthProvider>
  );
}
