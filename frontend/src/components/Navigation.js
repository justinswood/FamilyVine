import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, LogOut, ChevronDown, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import VineLogoCompact from './VineLogoCompact';
import GlobalSearch from './GlobalSearch';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMembersMenu, setShowMembersMenu] = useState(false);
  const [membersButtonRect, setMembersButtonRect] = useState(null);
  const menuRef = useRef(null);
  const membersMenuRef = useRef(null);
  const membersButtonRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (membersMenuRef.current && !membersMenuRef.current.contains(event.target)) {
        setShowMembersMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide navigation on login and register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMembersClick = () => {
    if (membersButtonRef.current) {
      const rect = membersButtonRef.current.getBoundingClientRect();
      setMembersButtonRect(rect);
    }
    setShowMembersMenu(!showMembersMenu);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 shadow-sm transition-colors duration-200 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-50">
      <div className="w-full px-3 py-2 flex items-center justify-between min-w-0">
        {/* Left section - Logo (fixed) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/">
            <VineLogoCompact />
          </Link>
        </div>

        {/* Center section - Scrollable Navigation Links */}
        <div className="flex-1 mx-4 min-w-0">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide pb-1">
            <Link
              to="/tree"
              className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 whitespace-nowrap flex-shrink-0"
            >
              Tree
            </Link>

            {/* Members Dropdown */}
            <div className="flex-shrink-0">
              <button
                ref={membersButtonRef}
                onClick={handleMembersClick}
                className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 whitespace-nowrap flex items-center gap-1"
              >
                Members
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <Link
              to="/gallery"
              className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 whitespace-nowrap flex-shrink-0"
            >
              Gallery
            </Link>

            <Link
              to="/map"
              className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 whitespace-nowrap flex-shrink-0"
            >
              Map
            </Link>


            <Link
              to="/timeline"
              className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 whitespace-nowrap flex-shrink-0"
            >
              Timeline
            </Link>

            <Link
              to="/calendar"
              className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 whitespace-nowrap flex-shrink-0"
            >
              Calendar
            </Link>

            <Link
              to="/stories"
              className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 font-medium rounded-md transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 whitespace-nowrap flex-shrink-0"
            >
              Stories
            </Link>
          </div>
        </div>

        {/* Right section - Search, Settings, and User Menu (fixed) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <GlobalSearch />
          <Link
            to="/settings"
            className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400
                       hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r
                       dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-full transition-all duration-300
                       hover:scale-110"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </Link>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400
                           hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r
                           dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-full transition-all duration-300
                           hover:scale-110"
                title="User Menu"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Members Dropdown Menu - Fixed positioning outside scrollable container */}
      {showMembersMenu && membersButtonRect && (
        <div
          ref={membersMenuRef}
          className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-[100]"
          style={{
            top: `${membersButtonRect.bottom + 8}px`,
            left: `${membersButtonRect.left}px`
          }}
        >
          <Link
            to="/members"
            onClick={() => setShowMembersMenu(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            View Members
          </Link>
          <Link
            to="/add"
            onClick={() => setShowMembersMenu(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
