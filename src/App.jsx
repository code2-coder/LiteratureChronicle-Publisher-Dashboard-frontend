import React, { lazy, Suspense } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

// Lazy load pages for performance
const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const AuthorDashboard = lazy(() => import('@/pages/AuthorDashboard.jsx'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard.jsx'));
const NotFound = lazy(() => import('@/pages/NotFound.jsx'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg"></div>
  </div>
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/author-dashboard"
                element={
                  <ProtectedRoute requiredRole="author">
                    <AuthorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;