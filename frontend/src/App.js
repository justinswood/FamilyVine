import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
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

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  
  // Hide navigation on login page
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow mb-6 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-green-700 dark:text-green-400">
          FamilyVine
        </Link>
        <div className="space-x-6">
          <Link 
            to="/members" 
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            View Members
          </Link>
          <Link 
            to="/add" 
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            Add Member
          </Link>
          <Link 
            to="/import-csv" 
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            Import CSV
          </Link>
          <Link 
            to="/gallery" 
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            Gallery
          </Link>
          <Link 
            to="/map" 
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            Map
          </Link>
          <Link 
            to="/visual-tree" 
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            Visual Tree
          </Link>
          <Link 
            to="/timeline" 
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            Timeline
          </Link>
          <Link 
            to="/settings"
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            Settings
          </Link>
          <Link 
            to="/login"
            className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
          >
            Logout
          </Link>
        </div>
      </div>
    </nav>
  );
};

function App() {
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

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        {/* Navigation will automatically hide on login page */}
        <Navigation />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddMember />} />
          <Route path="/members" element={<MemberList />} />
          <Route path="/members/:id" element={<MemberPage />} />
          <Route path="/members/:id/edit" element={<EditMember />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/import-csv" element={<CSVImport />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:id" element={<AlbumView />} />
          <Route path="/family-tree/:id" element={<FamilyTree />} />
          <Route path="/visual-tree" element={<VisualTreePage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;