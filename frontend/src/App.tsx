import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { AuthGuard } from './components/auth/AuthGuard';
import { ToastContainer } from './components/common';
import ErrorBoundary from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common';

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const TemplateGalleryPage = lazy(() => import('./pages/TemplateGalleryPage').then(m => ({ default: m.TemplateGalleryPage })));
const RenderPage = lazy(() => import('./pages/RenderPage').then(m => ({ default: m.RenderPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

function App() {
  const { isAuthenticated } = useAuthStore();
  const { toasts, hideToast } = useUIStore();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <LoadingSpinner size="lg" message="Cargando..." />
                </div>
              }
            >
              <Routes>
                {/* Root route - redirect based on auth state */}
                <Route
                  path="/"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/gallery" replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />

                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route
                  path="/gallery"
                  element={
                    <AuthGuard>
                      <TemplateGalleryPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/render"
                  element={
                    <AuthGuard>
                      <RenderPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <ProfilePage />
                    </AuthGuard>
                  }
                />

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            {/* Global Toast Container */}
            <ToastContainer toasts={toasts} onClose={hideToast} />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
