import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AddMember from './pages/AddMember';
import EditMember from './pages/EditMember';
import MemberPage from './pages/MemberPage';
import MemberList from './pages/MemberList';
import MapPage from './pages/MapPage';
import CSVImport from './pages/CSVImport';
import Gallery from './pages/Gallery';
import AlbumView from './pages/AlbumView';
import FamilyTree from './pages/FamilyTree';
import VisualTreePage from './pages/VisualTreePage';
import FamilyTreeDebug from './components/FamilyTreeDebug';
import Settings from './pages/Settings';
import TimelinePage from './pages/TimelinePage';
import CalendarPage from './pages/CalendarPage';
import LoginPage from './pages/LoginPage';
import EnhancedTreePage from './pages/EnhancedTreePage';

// Component to protect routes - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('familyVine_loggedIn') === 'true';
  
  if (!isLoggedIn) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, show the requested page
  return children;
};

// Navigation Component - UPDATED with thinner design
const Navigation = () => {
  const location = useLocation();
  
  // Hide navigation on login page
  if (location.pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    // Clear login status
    localStorage.removeItem('familyVine_loggedIn');
    localStorage.removeItem('familyVine_user');
    // Page will automatically redirect to login due to ProtectedRoute
    window.location.reload();
  };

  return (
    <nav className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 shadow-sm transition-colors duration-200 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-8">
        {/* Logo with blue-purple gradient styling */}
        <Link 
          to="/" 
          className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          FamilyVine
        </Link>
        
        {/* Navigation Links with smaller padding */}
        <div className="flex items-center space-x-1">
          <Link 
            to="/members" 
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
          >
            Members
          </Link>
          
          <Link 
            to="/add" 
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
          >
            Add
          </Link>
          
          <Link 
            to="/gallery" 
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
          >
            Gallery
          </Link>
          
          <Link 
            to="/map" 
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
          >
            Map
          </Link>
          
          <Link 
            to="/visual-tree" 
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
          >
            Tree
          </Link>
          
          <Link 
            to="/timeline" 
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
          >
            Timeline
          </Link>
          
          <Link 
            to="/calendar" 
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
          >
            Calendar
          </Link>
          
          <Link 
            to="/settings"
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
          >
            Settings
          </Link>
          
          {/* Logout button with special styling */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
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
      {/* REMOVED: mb-6 class to eliminate gap between navbar and content */}
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        {/* Navigation will automatically hide on login page */}
        <Navigation />
        
        <Routes>
          {/* Login route - accessible without authentication */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* All other routes are protected */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
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
          <Route path="/family-tree/:id" element={
            <ProtectedRoute>
              <FamilyTree />
            </ProtectedRoute>
          } />
          <Route path="/visual-tree" element={
            <ProtectedRoute>
              <VisualTreePage />
            </ProtectedRoute>
          } />
          <Route path="/enhanced-tree" element={
            <ProtectedRoute>
              <EnhancedTreePage />
            </ProtectedRoute>
          } />
          <Route path="/debug-tree" element={
            <ProtectedRoute>
              <FamilyTreeDebug />
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;