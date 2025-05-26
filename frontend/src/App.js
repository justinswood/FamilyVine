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
import Settings from './pages/Settings';
import TimelinePage from './pages/TimelinePage';
import LoginPage from './pages/LoginPage';

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

// Navigation Component
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
    <nav className="bg-white dark:bg-gray-800 shadow-lg mb-6 transition-colors duration-200 border-b-2 border-green-100 dark:border-green-800">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo with enhanced styling */}
        <Link 
          to="/" 
          className="text-2xl font-bold text-green-700 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-all duration-300 transform hover:scale-105"
        >
          FamilyVine
        </Link>
        
        {/* Navigation Links with Enhanced Styling */}
        <div className="flex items-center space-x-2">
          <Link 
            to="/members" 
            className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md transform hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">View Members</span>
            {/* Subtle underline animation */}
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-3/4 group-hover:left-1/8"></div>
          </Link>
          
          <Link 
            to="/add" 
            className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md transform hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Add Member</span>
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-3/4 group-hover:left-1/8"></div>
          </Link>
          
          <Link 
            to="/gallery" 
            className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md transform hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Gallery</span>
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-3/4 group-hover:left-1/8"></div>
          </Link>
          
          <Link 
            to="/map" 
            className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md transform hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Map</span>
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-3/4 group-hover:left-1/8"></div>
          </Link>
          
          <Link 
            to="/visual-tree" 
            className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md transform hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Visual Tree</span>
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-3/4 group-hover:left-1/8"></div>
          </Link>
          
          <Link 
            to="/timeline" 
            className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md transform hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Timeline</span>
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-3/4 group-hover:left-1/8"></div>
          </Link>
          
          <Link 
            to="/settings"
            className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md transform hover:-translate-y-0.5 group"
          >
            <span className="relative z-10">Settings</span>
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-3/4 group-hover:left-1/8"></div>
          </Link>
          
          {/* Logout button with special styling */}
          <button
            onClick={handleLogout}
            className="relative px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-md transform hover:-translate-y-0.5 group ml-2"
          >
            <span className="relative z-10">Logout</span>
            <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-3/4 group-hover:left-1/8"></div>
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;