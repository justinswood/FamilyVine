import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import OfflineIndicator from './components/OfflineIndicator';
import InstallPrompt from './components/InstallPrompt';
import ScrollToTop from './components/ScrollToTop';

// Lazy load all page components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const AddMember = lazy(() => import('./pages/AddMember'));
const EditMember = lazy(() => import('./pages/EditMember'));
const MemberPage = lazy(() => import('./pages/MemberPage'));
const MemberList = lazy(() => import('./pages/MemberList'));
const MapPage = lazy(() => import('./pages/MapPage'));
const CSVImport = lazy(() => import('./pages/CSVImport'));
const Gallery = lazy(() => import('./pages/Gallery'));
const AlbumView = lazy(() => import('./pages/AlbumView'));
const Settings = lazy(() => import('./pages/Settings'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const FamilyTreePage = lazy(() => import('./pages/FamilyTreePage'));
const StoriesPage = lazy(() => import('./pages/StoriesPage'));
const StoryView = lazy(() => import('./pages/StoryView'));
const AddEditStory = lazy(() => import('./pages/AddEditStory'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const RecipeView = lazy(() => import('./pages/RecipeView'));

// Loading Spinner Component
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F3' }}>
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-vine-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-vine-sage font-body">{message}</p>
    </div>
  </div>
);

// Component to protect routes - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  const location = useLocation();

  // Pages that use their own full-screen layout (no Navigation/accent bar)
  const fullScreenPages = ['/tree'];
  const isFullScreenPage = fullScreenPages.includes(location.pathname);

  return (
    <div className="min-h-screen transition-colors duration-200 main-content" style={{ backgroundColor: 'transparent' }}>
      {/* Navigation - hidden on full-screen pages like Family Tree */}
      {!isFullScreenPage && <Navigation />}

      {/* Vine accent bar — hidden on full-screen pages */}
      {!isFullScreenPage && (
        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #86A789, #4A7C3F, #800080, #4A7C3F, #86A789)' }}></div>
      )}

      {/* PWA Components */}
      <OfflineIndicator />
      <InstallPrompt />

      {/* Suspense boundary for lazy-loaded routes */}
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/tree" element={<ProtectedRoute><FamilyTreePage /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><MemberList /></ProtectedRoute>} />
          <Route path="/members/:id" element={<ProtectedRoute><MemberPage /></ProtectedRoute>} />
          <Route path="/members/:id/edit" element={<ProtectedRoute><EditMember /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/import-csv" element={<ProtectedRoute><CSVImport /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/gallery/:id" element={<ProtectedRoute><AlbumView /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/stories" element={<ProtectedRoute><StoriesPage /></ProtectedRoute>} />
          <Route path="/stories/new" element={<ProtectedRoute><AddEditStory /></ProtectedRoute>} />
          <Route path="/stories/:id" element={<ProtectedRoute><StoryView /></ProtectedRoute>} />
          <Route path="/stories/:id/edit" element={<ProtectedRoute><AddEditStory /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          <Route path="/recipes/:id" element={<ProtectedRoute><RecipeView /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ScrollToTop />
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
