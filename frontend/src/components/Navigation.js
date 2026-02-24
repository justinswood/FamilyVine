import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, LogOut, ChevronDown, UserPlus, Users, Image, Book, Clock, UtensilsCrossed, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMembersMenu, setShowMembersMenu] = useState(false);
  const [showMemoriesMenu, setShowMemoriesMenu] = useState(false);
  const [membersButtonRect, setMembersButtonRect] = useState(null);
  const [memoriesButtonRect, setMemoriesButtonRect] = useState(null);
  const menuRef = useRef(null);
  const membersMenuRef = useRef(null);
  const memoriesMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (membersMenuRef.current && !membersMenuRef.current.contains(event.target)) {
        setShowMembersMenu(false);
      }
      if (memoriesMenuRef.current && !memoriesMenuRef.current.contains(event.target)) {
        setShowMemoriesMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide navigation for unauthenticated users and on auth pages
  if (!user || location.pathname === '/login' || location.pathname === '/register'
      || location.pathname === '/forgot-password' || location.pathname === '/reset-password') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMembersClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMembersButtonRect(rect);
    setShowMembersMenu(!showMembersMenu);
  };

  const handleMemoriesClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMemoriesButtonRect(rect);
    setShowMemoriesMenu(!showMemoriesMenu);
  };

  // Check if current path matches the link
  const isActive = (path) => location.pathname === path;
  const isActiveGroup = (paths) => paths.some(p => location.pathname.startsWith(p));

  // Archival nav link classes – parchment pill with gold active dot
  const getNavLinkClasses = (active) => `
    inline-block rounded-full px-3 py-2 md:px-3.5 md:py-1.5 text-xs font-medium transition-colors duration-300 relative
    ${active
      ? "text-[#2E5A2E] dark:text-vine-400 font-semibold after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-[#D4AF37]"
      : 'text-[#4A4A4A] dark:text-secondary-300 hover:text-[#2E5A2E] dark:hover:text-vine-400 hover:bg-[#2E5A2E]/10 dark:hover:bg-[#2E5A2E]/15'
    }
  `;

  // Common dropdown item classes
  const dropdownItemClasses = "flex items-center gap-2 px-3 py-2 text-xs text-vine-600 dark:text-secondary-300 hover:bg-vine-50 dark:hover:bg-vine-900/20 hover:text-vine-dark dark:hover:text-vine-400 transition-colors";

  return (
    <nav className="bg-vine-50/90 dark:bg-secondary-800 backdrop-blur-lg sticky top-0 z-50" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-3 py-1.5">
        <div className="flex items-center justify-between">
          {/* Left section - Logo */}
          <div className="flex items-center flex-1">
            <Link to="/" className="block group -my-3">
              <img
                src="/logo.png"
                alt="FamilyVine"
                className="h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                style={{ maxWidth: '180px' }}
              />
            </Link>
          </div>

          {/* Center section - Dock-style Navigation */}
          <div className="hidden md:flex items-center justify-center">
            <div
              className="flex items-center rounded-full p-1 backdrop-blur-sm"
              style={{
                backgroundColor: isDark ? '#1e293b' : '#F9F8F3',
                border: `1px solid rgba(212, 175, 55, ${isDark ? '0.15' : '0.3'})`,
                boxShadow: isDark
                  ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(212, 175, 55, 0.1)'
                  : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(212, 175, 55, 0.2)',
              }}
            >
              <Link to="/tree" className={getNavLinkClasses(isActive('/tree'))}>
                Tree
              </Link>

              {/* Members Dropdown */}
              <div className="relative">
                <button
                  onClick={handleMembersClick}
                  aria-expanded={showMembersMenu}
                  aria-haspopup="true"
                  className={`${getNavLinkClasses(isActiveGroup(['/members', '/add']))} flex items-center gap-1`}
                >
                  Members
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMembersMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Memories Dropdown */}
              <div className="relative">
                <button
                  onClick={handleMemoriesClick}
                  aria-expanded={showMemoriesMenu}
                  aria-haspopup="true"
                  className={`${getNavLinkClasses(isActiveGroup(['/gallery', '/recipes', '/stories', '/timeline']))} flex items-center gap-1`}
                >
                  Memories
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMemoriesMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <Link to="/map" className={getNavLinkClasses(isActive('/map'))}>
                Map
              </Link>

              <Link to="/calendar" className={getNavLinkClasses(isActive('/calendar'))}>
                Calendar
              </Link>
            </div>
          </div>

          {/* Right section - Theme Toggle, Settings, and User Menu */}
          <div className="flex items-center gap-1 flex-1 justify-end">

            {/* Donate Button */}
            <a
              href="https://www.paypal.com/donate/?business=ES3DVUN5F32GE&no_recurring=0&item_name=FamilyVine+is+a+labor+of+love.+Help+us+keep+our+history+safe%2C+private%2C+and+hosted+for+every+generation.+Thanks+for+the+support%21&currency_code=USD"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300
                         hover:bg-[#F9F8F3] dark:hover:bg-secondary-700 rounded-full transition-colors duration-300"
              title="Support FamilyVine"
            >
              <Heart className="w-4 h-4" fill="currentColor" />
            </a>

            <Link
              to="/settings"
              className="p-1.5 text-[#2E5A2E] dark:text-[#D4AF37] hover:text-[#D4AF37] dark:hover:text-vine-400
                         hover:bg-[#F9F8F3] dark:hover:bg-secondary-700 rounded-full transition-all duration-300"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>

            {/* User Menu */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  className="p-1.5 text-[#2E5A2E] dark:text-[#D4AF37] hover:text-[#D4AF37] dark:hover:text-vine-400
                             hover:bg-[#F9F8F3] dark:hover:bg-secondary-700 rounded-full transition-all duration-300"
                  title="User Menu"
                  aria-label="User menu"
                >
                  <User className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-1.5 w-48 card py-1.5 z-50 animate-scale-in">
                    <div className="px-3 py-2 border-b border-vine-200 dark:border-secondary-700">
                      <p className="text-xs font-semibold text-vine-dark dark:text-white font-heading">{user.username}</p>
                      <p className="text-[0.65rem] text-vine-sage dark:text-secondary-400 mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[0.65rem] font-medium bg-vine-100 dark:bg-vine-900/30 text-vine-600 dark:text-vine-300 rounded-full capitalize">
                        {user.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-vine-600 dark:text-secondary-300 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-600 dark:hover:text-error-400 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation - Simplified row below */}
        <div className="md:hidden mt-2">
          <div
            className="flex items-center justify-center rounded-full p-1 overflow-x-auto backdrop-blur-sm"
            style={{
              backgroundColor: isDark ? '#1e293b' : '#F9F8F3',
              border: `1px solid rgba(212, 175, 55, ${isDark ? '0.15' : '0.3'})`,
              boxShadow: isDark
                ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(212, 175, 55, 0.1)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(212, 175, 55, 0.2)',
            }}
          >
            <Link to="/tree" className={getNavLinkClasses(isActive('/tree'))}>
              Tree
            </Link>
            <button
              onClick={handleMembersClick}
              aria-expanded={showMembersMenu}
              aria-haspopup="true"
              className={`${getNavLinkClasses(isActiveGroup(['/members', '/add']))} flex items-center gap-1`}
            >
              Members
              <ChevronDown className={`w-3 h-3 ${showMembersMenu ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={handleMemoriesClick}
              aria-expanded={showMemoriesMenu}
              aria-haspopup="true"
              className={`${getNavLinkClasses(isActiveGroup(['/gallery', '/recipes', '/stories', '/timeline']))} flex items-center gap-1`}
            >
              Memories
              <ChevronDown className={`w-3 h-3 ${showMemoriesMenu ? 'rotate-180' : ''}`} />
            </button>
            <Link to="/map" className={getNavLinkClasses(isActive('/map'))}>
              Map
            </Link>
            <Link to="/calendar" className={getNavLinkClasses(isActive('/calendar'))}>
              Calendar
            </Link>
          </div>
        </div>
      </div>

      {/* Members Dropdown Menu - Fixed positioning */}
      {showMembersMenu && membersButtonRect && createPortal(
        <div
          ref={membersMenuRef}
          role="menu"
          aria-label="Members menu"
          className="fixed w-44 card py-1.5 animate-scale-in"
          style={{
            top: `${membersButtonRect.bottom + 6}px`,
            left: `${Math.max(8, Math.min(window.innerWidth - 184, membersButtonRect.left + (membersButtonRect.width / 2) - 88))}px`,
            zIndex: 10000
          }}
        >
          <Link
            to="/members"
            role="menuitem"
            onClick={() => setShowMembersMenu(false)}
            className={dropdownItemClasses}
          >
            <Users className="w-3.5 h-3.5" />
            View Members
          </Link>
          <Link
            to="/add"
            role="menuitem"
            onClick={() => setShowMembersMenu(false)}
            className={dropdownItemClasses}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Member
          </Link>
        </div>,
        document.body
      )}

      {/* Memories Dropdown Menu - Fixed positioning */}
      {showMemoriesMenu && memoriesButtonRect && createPortal(
        <div
          ref={memoriesMenuRef}
          role="menu"
          aria-label="Memories menu"
          className="fixed w-44 card py-1.5 animate-scale-in"
          style={{
            top: `${memoriesButtonRect.bottom + 6}px`,
            left: `${Math.max(8, Math.min(window.innerWidth - 184, memoriesButtonRect.left + (memoriesButtonRect.width / 2) - 88))}px`,
            zIndex: 10000
          }}
        >
          <Link
            to="/gallery"
            role="menuitem"
            onClick={() => setShowMemoriesMenu(false)}
            className={dropdownItemClasses}
          >
            <Image className="w-3.5 h-3.5" />
            Gallery
          </Link>
          <Link
            to="/recipes"
            role="menuitem"
            onClick={() => setShowMemoriesMenu(false)}
            className={dropdownItemClasses}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Recipes
          </Link>
          <Link
            to="/stories"
            role="menuitem"
            onClick={() => setShowMemoriesMenu(false)}
            className={dropdownItemClasses}
          >
            <Book className="w-3.5 h-3.5" />
            Stories
          </Link>
          <Link
            to="/timeline"
            role="menuitem"
            onClick={() => setShowMemoriesMenu(false)}
            className={dropdownItemClasses}
          >
            <Clock className="w-3.5 h-3.5" />
            Timeline
          </Link>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default React.memo(Navigation);
