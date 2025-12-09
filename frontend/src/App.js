import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

// Component to protect routes - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  // If authenticated, show the requested page
  return children;
};

function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Load and apply theme on app start
    const savedSettings = localStorage.getItem('familyVineSettings');
    if (savedSettings) {
      const { theme } = JSON.parse(savedSettings);
      applyTheme(theme || 'light');
    }

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'familyVineSettings') {
        const newSettings = JSON.parse(e.newValue);
        applyTheme(newSettings.theme || 'light');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Quick auth check (you can make this more sophisticated later)
    setIsCheckingAuth(false);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else { // auto
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading FamilyVine...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        {/* REMOVED: mb-6 class to eliminate gap between navbar and content */}
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 main-content">
          {/* Navigation will automatically hide on login page */}
          <Navigation />

          {/* PWA Components */}
          <OfflineIndicator />
          <InstallPrompt />

          {/* Suspense boundary for lazy-loaded routes */}
          <Suspense fallback={
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            </div>
          }>
            <Routes>
              {/* Public routes - accessible without authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* All other routes are protected */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/tree" element={
            <ProtectedRoute>
              <FamilyTreePage />
            </ProtectedRoute>
          } />
          <Route path="/add" element={
            <ProtectedRoute>
              <AddMember />
            </ProtectedRoute>
          } />
          <Route path="/members" element={
            <ProtectedRoute>
              <MemberList />
            </ProtectedRoute>
          } />
          <Route path="/members/:id" element={
            <ProtectedRoute>
              <MemberPage />
            </ProtectedRoute>
          } />
          <Route path="/members/:id/edit" element={
            <ProtectedRoute>
              <EditMember />
            </ProtectedRoute>
          } />
          <Route path="/map" element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          } />
          <Route path="/import-csv" element={
            <ProtectedRoute>
              <CSVImport />
            </ProtectedRoute>
          } />
          <Route path="/gallery" element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          } />
          <Route path="/gallery/:id" element={
            <ProtectedRoute>
              <AlbumView />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/timeline" element={
            <ProtectedRoute>
              <TimelinePage />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } />
          <Route path="/stories" element={
            <ProtectedRoute>
              <StoriesPage />
            </ProtectedRoute>
          } />
          <Route path="/stories/new" element={
            <ProtectedRoute>
              <AddEditStory />
            </ProtectedRoute>
          } />
          <Route path="/stories/:id" element={
            <ProtectedRoute>
              <StoryView />
            </ProtectedRoute>
          } />
          <Route path="/stories/:id/edit" element={
            <ProtectedRoute>
              <AddEditStory />
            </ProtectedRoute>
          } />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;