import React, { useState, useEffect } from 'react';
import { Download, Database, Shield, Bell, Palette, User, Users, Save, Upload, LogOut, Plus, Key, Trash2, Edit2, TreePine } from 'lucide-react';
import { useMembers } from '../hooks/useQueries';
import ExportFamilyData from '../components/ExportFamilyData';
import CSVImport from './CSVImport'; // Import the CSVImport component
import axios from 'axios';
import HeroImageSelector from '../components/HeroImageSelector';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences, useUpdatePreferences } from '../hooks/useQueries';

const ComingSoonBadge = () => (
  <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full font-normal">
    Coming Soon
  </span>
);

const Settings = () => {
  const { user } = useAuth();
  const { theme: currentTheme, setTheme: setGlobalTheme } = useTheme();
  const { data: serverPrefs, isLoading: prefsLoading } = usePreferences();
  const updatePrefsMutation = useUpdatePreferences();
  const [activeTab, setActiveTab] = useState('general');
  const [showExportModal, setShowExportModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Account tab state
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [emailData, setEmailData] = useState({ email: '', password: '' });
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Tree preferences state
  const [treePrefs, setTreePrefs] = useState({
    defaultRootMember: null,
    generationDepth: 4,
    showUnknownParents: false,
  });

  // Members list for tree root picker
  const { data: allMembers = [] } = useMembers();

  // User management state (admin only)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'viewer' });
  const [newPassword, setNewPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    familyName: '',
    defaultPrivacy: 'private',
    autoSaveInterval: 5,
    
    // Display Settings
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    
    // Privacy Settings
    showPrivateInfo: false,
    requireLoginForViewing: false,
    allowGuestAccess: false,
    
    // Notification Settings
    emailNotifications: true,
    memberUpdates: true,
    relationshipChanges: true,
    photoUploads: false,
  });

  useEffect(() => {
    fetchData();
    loadSettings();

    // Check URL parameters for tab
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['account', 'general', 'display', 'privacy', 'users', 'import', 'export', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Fetch users when users tab is selected (admin only)
  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab, user?.role]);

  // Sync server preferences into local state
  useEffect(() => {
    if (serverPrefs) {
      setSettings(prev => ({
        ...prev,
        familyName: serverPrefs.family_name ?? prev.familyName,
        defaultPrivacy: serverPrefs.default_privacy ?? prev.defaultPrivacy,
        dateFormat: serverPrefs.date_format ?? prev.dateFormat,
        showPrivateInfo: serverPrefs.show_private_info ?? prev.showPrivateInfo,
        requireLoginForViewing: serverPrefs.require_login_for_viewing ?? prev.requireLoginForViewing,
        allowGuestAccess: serverPrefs.allow_guest_access ?? prev.allowGuestAccess,
        emailNotifications: serverPrefs.email_notifications ?? prev.emailNotifications,
        memberUpdates: serverPrefs.member_updates ?? prev.memberUpdates,
        relationshipChanges: serverPrefs.relationship_changes ?? prev.relationshipChanges,
        photoUploads: serverPrefs.photo_uploads ?? prev.photoUploads,
      }));
      setTreePrefs({
        defaultRootMember: serverPrefs.default_root_member_id ?? null,
        generationDepth: serverPrefs.preferred_generation_depth ?? 4,
        showUnknownParents: serverPrefs.show_unknown_parents ?? false,
      });
    }
  }, [serverPrefs]);

  const fetchData = async () => {
    try {
      const [membersResponse, relationshipsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/members`),
        axios.get(`${process.env.REACT_APP_API}/api/relationships`).catch(() => ({ data: [] }))
      ]);

      setMembers(membersResponse.data);
      setRelationships(relationshipsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for admin panel
  const fetchUsers = async () => {
    if (user?.role !== 'admin') return;
    setUsersLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/auth/users`);
      setUsersList(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUserError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Create new user (admin only)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newUser.username || !newUser.password) {
      setUserError('Username and password are required');
      return;
    }

    if (newUser.password.length < 8) {
      setUserError('Password must be at least 8 characters');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API}/api/auth/users`, newUser);
      setUserSuccess('User created successfully');
      setNewUser({ username: '', email: '', password: '', role: 'viewer' });
      setShowCreateUser(false);
      fetchUsers();
    } catch (error) {
      setUserError(error.response?.data?.error || 'Failed to create user');
    }
  };

  // Change user password (admin only)
  const handleChangePassword = async (userId) => {
    setUserError('');
    setUserSuccess('');

    if (!newPassword || newPassword.length < 8) {
      setUserError('Password must be at least 8 characters');
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API}/api/auth/users/${userId}/password`, { password: newPassword });
      setUserSuccess('Password changed successfully');
      setNewPassword('');
      setShowChangePassword(null);
    } catch (error) {
      setUserError(error.response?.data?.error || 'Failed to change password');
    }
  };

  // Change user role (admin only)
  const handleChangeRole = async (userId, newRole) => {
    setUserError('');
    setUserSuccess('');

    try {
      await axios.put(`${process.env.REACT_APP_API}/api/auth/users/${userId}/role`, { role: newRole });
      setUserSuccess('Role updated successfully');
      fetchUsers();
    } catch (error) {
      setUserError(error.response?.data?.error || 'Failed to change role');
    }
  };

  // Delete user (admin only)
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }

    setUserError('');
    setUserSuccess('');

    try {
      await axios.delete(`${process.env.REACT_APP_API}/api/auth/users/${userId}`);
      setUserSuccess('User deleted successfully');
      fetchUsers();
    } catch (error) {
      setUserError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('familyVineSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsed }));
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updatePrefsMutation.mutateAsync({
        family_name: settings.familyName,
        default_privacy: settings.defaultPrivacy,
        date_format: settings.dateFormat,
        show_private_info: settings.showPrivateInfo,
        require_login_for_viewing: settings.requireLoginForViewing,
        allow_guest_access: settings.allowGuestAccess,
        email_notifications: settings.emailNotifications,
        member_updates: settings.memberUpdates,
        relationship_changes: settings.relationshipChanges,
        photo_uploads: settings.photoUploads,
        default_root_member_id: treePrefs.defaultRootMember,
        preferred_generation_depth: treePrefs.generationDepth,
        show_unknown_parents: treePrefs.showUnknownParents,
      });

      // Also cache in localStorage as fallback
      localStorage.setItem('familyVineSettings', JSON.stringify(settings));

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    // Clear login status
    localStorage.removeItem('familyVine_loggedIn');
    localStorage.removeItem('familyVine_user');
    // Page will automatically redirect to login due to ProtectedRoute
    window.location.reload();
  };

  const handleSettingChange = (section, setting, value) => {
    if (setting === 'theme') {
      setGlobalTheme(value);
      return;
    }
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Account handlers
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setAccountError('');
    setAccountSuccess('');

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setAccountError('All fields are required');
      return;
    }
    if (passwordData.new.length < 8) {
      setAccountError('Password must be at least 8 characters');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setAccountError('New passwords do not match');
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API}/api/auth/me/password`, {
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      });
      setAccountSuccess('Password changed successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      setAccountError(error.response?.data?.error || 'Failed to change password');
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setAccountError('');
    setAccountSuccess('');

    if (!emailData.email || !emailData.password) {
      setAccountError('Email and password are required');
      return;
    }

    try {
      const response = await axios.put(`${process.env.REACT_APP_API}/api/auth/me/email`, {
        email: emailData.email,
        password: emailData.password,
      });
      setAccountSuccess('Email changed successfully');
      setEmailData({ email: '', password: '' });
      // Update stored user
      const updatedUser = { ...user, email: response.data.email };
      localStorage.setItem('familyVine_user', JSON.stringify(updatedUser));
    } catch (error) {
      setAccountError(error.response?.data?.error || 'Failed to change email');
    }
  };

  const baseTabs = [
    { id: 'general', label: 'General', icon: <Database className="w-4 h-4" /> },
    { id: 'display', label: 'Display', icon: <Palette className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
  ];

  // Admin-only tabs
  const adminTabs = user?.role === 'admin' ? [
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  ] : [];

  const tabs = [
    { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
    ...baseTabs,
    { id: 'tree', label: 'Family Tree', icon: <TreePine className="w-4 h-4" /> },
    ...adminTabs,
    { id: 'import', label: 'Import Data', icon: <Upload className="w-4 h-4" /> },
    { id: 'export', label: 'Export Data', icon: <Download className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-4 h-4" /> },
  ];

  const renderAccountSettings = () => (
    <div className="space-y-6">
      {accountError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {accountError}
        </div>
      )}
      {accountSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
          {accountSuccess}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-vine-50 dark:bg-gray-800 border border-vine-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-vine-dark dark:text-white mb-2">Account Information</h4>
        <div className="text-sm text-vine-sage dark:text-secondary-400 space-y-1">
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Email:</strong> {user?.email || 'Not set'}</p>
          <p><strong>Role:</strong> <span className="capitalize">{user?.role}</span></p>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border border-vine-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-vine-dark dark:text-white mb-4">Change Password</h4>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordData.current}
              onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
              className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
              className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Min 8 characters"
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
              className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border border-vine-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-vine-dark dark:text-white mb-4">Change Email</h4>
        <form onSubmit={handleEmailChange} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">New Email Address</label>
            <input
              type="email"
              value={emailData.email}
              onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter new email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">Confirm with Password</label>
            <input
              type="password"
              value={emailData.password}
              onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter password to confirm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}
          >
            Update Email
          </button>
        </form>
      </div>
    </div>
  );

  const renderTreeSettings = () => (
    <div className="space-y-6">
      <div className="bg-vine-50 dark:bg-gray-800 border border-vine-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-vine-dark dark:text-white mb-1">Family Tree Display</h4>
        <p className="text-sm text-vine-sage dark:text-secondary-400">
          Customize how your family tree loads and displays by default
        </p>
      </div>

      {/* Default Root Member */}
      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-2">
          Default Starting Member
        </label>
        <select
          value={treePrefs.defaultRootMember || ''}
          onChange={(e) => setTreePrefs(prev => ({ ...prev, defaultRootMember: e.target.value ? parseInt(e.target.value) : null }))}
          className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Automatic (oldest generation)</option>
          {allMembers
            .filter(m => m.first_name !== 'Unknown')
            .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
            .map(m => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}{m.birth_date ? ` (b. ${new Date(m.birth_date).getFullYear()})` : ''}
              </option>
            ))
          }
        </select>
        <p className="text-xs text-vine-sage dark:text-secondary-400 mt-1">
          The family tree will center on this person when first loaded
        </p>
      </div>

      {/* Generation Depth */}
      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-2">
          Default Generation Depth
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={treePrefs.generationDepth}
          onChange={(e) => setTreePrefs(prev => ({ ...prev, generationDepth: parseInt(e.target.value) }))}
          className="w-full accent-vine-600"
        />
        <div className="flex justify-between text-xs text-vine-sage dark:text-secondary-400">
          <span>1</span>
          <span className="font-medium text-vine-dark dark:text-white">{treePrefs.generationDepth} generation{treePrefs.generationDepth !== 1 ? 's' : ''}</span>
          <span>10</span>
        </div>
        <p className="text-xs text-vine-sage dark:text-secondary-400 mt-1">
          How many generations to show by default (adjustable on the tree page)
        </p>
      </div>

      {/* Show Unknown Parents */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-vine-dark dark:text-gray-300">Show Unknown Parents</h4>
          <p className="text-xs text-vine-sage dark:text-secondary-400">Display placeholder nodes for unknown parents in the tree</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={treePrefs.showUnknownParents}
            onChange={(e) => setTreePrefs(prev => ({ ...prev, showUnknownParents: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vine-300 dark:peer-focus:ring-vine-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-vine-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vine-600"></div>
        </label>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-2">
          Family Name
        </label>
        <input
          type="text"
          value={settings.familyName}
          onChange={(e) => handleSettingChange('general', 'familyName', e.target.value)}
          className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="Enter your family name"
        />
        <p className="text-xs text-vine-sage dark:text-secondary-400 mt-1">
          This will appear in exported documents and reports
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-2">
          Default Privacy Level
        </label>
        <select
          value={settings.defaultPrivacy}
          onChange={(e) => handleSettingChange('general', 'defaultPrivacy', e.target.value)}
          className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="public">Public - Visible to everyone</option>
          <option value="family">Family Only - Visible to family members</option>
          <option value="private">Private - Visible only to you</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-2">
          Auto-save Interval (minutes)
          <ComingSoonBadge />
        </label>
        <select
          value={settings.autoSaveInterval}
          disabled
          className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 opacity-60 cursor-not-allowed"
        >
          <option value={5}>5 minutes</option>
        </select>
        <p className="text-xs text-vine-sage dark:text-secondary-400 mt-1">
          Automatic saving will be available in a future update
        </p>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-2">
          Date Format
        </label>
        <select
          value={settings.dateFormat}
          onChange={(e) => handleSettingChange('display', 'dateFormat', e.target.value)}
          className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY (American)</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY (European)</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          <option value="MMM DD, YYYY">MMM DD, YYYY (Long format)</option>
        </select>
      </div>
  
      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-2">
          Theme
        </label>
        <select
          value={currentTheme}
          onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
          className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="light">Light Theme</option>
          <option value="dark">Dark Theme</option>
          <option value="auto">Auto (System Preference)</option>
        </select>
        <p className="text-xs text-vine-sage dark:text-secondary-400 mt-1">
          {currentTheme === 'auto'
            ? 'Theme will match your system preference'
            : `Currently using ${currentTheme} theme`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-2">
          Language
          <ComingSoonBadge />
        </label>
        <select
          value={settings.language}
          disabled
          className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 opacity-60 cursor-not-allowed"
        >
          <option value="en">English</option>
        </select>
        <p className="text-xs text-vine-sage dark:text-secondary-400 mt-1">
          Multi-language support will be added in a future release
        </p>
      </div>
  
      <div>
        <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-4">
          Homepage Hero Images
        </label>
        <HeroImageSelector />
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-vine-dark dark:text-gray-300">Show Private Information</h4>
          <p className="text-xs text-vine-sage dark:text-secondary-400">Include email addresses and phone numbers in exports</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showPrivateInfo}
            onChange={(e) => handleSettingChange('privacy', 'showPrivateInfo', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vine-300 dark:peer-focus:ring-vine-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-vine-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vine-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-vine-dark dark:text-gray-300">Require Login for Viewing</h4>
          <p className="text-xs text-vine-sage dark:text-secondary-400">Users must log in to view family tree</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requireLoginForViewing}
            onChange={(e) => handleSettingChange('privacy', 'requireLoginForViewing', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vine-300 dark:peer-focus:ring-vine-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-vine-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vine-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-vine-dark dark:text-gray-300">Allow Guest Access</h4>
          <p className="text-xs text-vine-sage dark:text-secondary-400">Allow viewing without creating an account</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowGuestAccess}
            onChange={(e) => handleSettingChange('privacy', 'allowGuestAccess', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vine-300 dark:peer-focus:ring-vine-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-vine-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vine-600"></div>
        </label>
      </div>
    </div>
  );

  // NEW: Import Data tab content
  const renderImportSettings = () => (
    <div className="space-y-6">
      <div className="hero-selector-banner">
        <h3>Import Family Data</h3>
        <p>
          Import family members from CSV files or other data sources to quickly build your family tree.
        </p>
      </div>

      {/* CSV Import Section */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border border-white/50 dark:border-gray-700 rounded-xl">
        <CSVImport />
      </div>

      {/* Future import options placeholder */}
      <div className="bg-vine-50 dark:bg-gray-800 border border-vine-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-vine-dark dark:text-gray-200 mb-2">Coming Soon</h4>
        <ul className="text-sm text-vine-sage dark:text-secondary-400 space-y-1">
          <li>• GEDCOM file import</li>
          <li>• Excel/Google Sheets import</li>
          <li>• Import from other family tree services</li>
          <li>• Photo bulk import from cloud services</li>
        </ul>
      </div>
    </div>
  );

  const renderExportSettings = () => (
    <div className="space-y-6">
      <div className="bg-vine-50 dark:bg-vine-900/20 border border-vine-200 dark:border-vine-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold font-heading text-vine-dark dark:text-white mb-2">Export Your Family Data</h3>
        <p className="text-vine-600 dark:text-vine-300 text-sm mb-4">
          Export your family tree in various formats for backup, sharing, or importing into other applications.
        </p>
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-gradient-to-r from-vine-500 to-vine-600 text-white px-4 py-2 rounded-lg hover:from-vine-600 hover:to-vine-dark transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Open Export Tool
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-vine-200 dark:border-gray-700 rounded-lg p-4 bg-white/80 backdrop-blur-sm dark:bg-gray-800">
          <h4 className="font-medium text-vine-dark dark:text-gray-200 mb-2">Available Formats</h4>
          <ul className="text-sm text-vine-sage dark:text-secondary-400 space-y-1">
            <li>• CSV - Spreadsheet format</li>
            <li>• JSON - Structured data</li>
            <li>• GEDCOM - Genealogy standard</li>
            <li>• PDF - Printable reports</li>
          </ul>
        </div>
        
        <div className="border border-vine-200 dark:border-gray-700 rounded-lg p-4 bg-white/80 backdrop-blur-sm dark:bg-gray-800">
          <h4 className="font-medium text-vine-dark dark:text-gray-200 mb-2">Export Options</h4>
          <ul className="text-sm text-vine-sage dark:text-secondary-400 space-y-1">
            <li>• Include/exclude private data</li>
            <li>• Select specific members</li>
            <li>• Include photos (where supported)</li>
            <li>• Relationship data</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-vine-dark dark:text-gray-300">Email Notifications</h4>
          <p className="text-xs text-vine-sage dark:text-secondary-400">Receive email updates about family tree changes</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vine-300 dark:peer-focus:ring-vine-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-vine-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vine-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-vine-dark dark:text-gray-300">Member Updates</h4>
          <p className="text-xs text-vine-sage dark:text-secondary-400">Get notified when member information is updated</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.memberUpdates}
            onChange={(e) => handleSettingChange('notifications', 'memberUpdates', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vine-300 dark:peer-focus:ring-vine-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-vine-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vine-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-vine-dark dark:text-gray-300">Relationship Changes</h4>
          <p className="text-xs text-vine-sage dark:text-secondary-400">Alerts when relationships are added or modified</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.relationshipChanges}
            onChange={(e) => handleSettingChange('notifications', 'relationshipChanges', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vine-300 dark:peer-focus:ring-vine-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-vine-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vine-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-vine-dark dark:text-gray-300">Photo Uploads</h4>
          <p className="text-xs text-vine-sage dark:text-secondary-400">Notifications when new photos are added</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.photoUploads}
            onChange={(e) => handleSettingChange('notifications', 'photoUploads', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vine-300 dark:peer-focus:ring-vine-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-vine-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vine-600"></div>
        </label>
      </div>
    </div>
  );

  // User Management Tab (Admin Only)
  const renderUsersSettings = () => (
    <div className="space-y-6">
      {/* Header with Create User button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold font-heading text-vine-dark dark:text-white">User Management</h3>
          <p className="text-sm text-vine-sage dark:text-secondary-400">Create and manage user accounts</p>
        </div>
        <button
          onClick={() => { setShowCreateUser(true); setUserError(''); setUserSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Success/Error Messages */}
      {userError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {userError}
        </div>
      )}
      {userSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {userSuccess}
        </div>
      )}

      {/* Create User Form */}
      {showCreateUser && (
        <div className="bg-vine-50 dark:bg-gray-800 border border-vine-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-vine-dark dark:text-white mb-4">Create New User</h4>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vine-dark dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border border-vine-200 rounded-lg px-3 py-2 bg-white/90 focus:ring-2 focus:ring-vine-500 focus:border-vine-500 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-white transition-colors"
                style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}
              >
                Create User
              </button>
              <button
                type="button"
                onClick={() => { setShowCreateUser(false); setNewUser({ username: '', email: '', password: '', role: 'viewer' }); }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800 border border-vine-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {usersLoading ? (
          <div className="p-8 text-center text-vine-sage dark:text-secondary-400">
            Loading users...
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-8 text-center text-vine-sage dark:text-secondary-400">
            No users found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-vine-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-vine-dark dark:text-gray-200">Username</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-vine-dark dark:text-gray-200 hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-vine-dark dark:text-gray-200">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-vine-dark dark:text-gray-200 hidden lg:table-cell">Last Login</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-vine-dark dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vine-100 dark:divide-gray-700">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-vine-50/50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-vine-sage dark:text-secondary-400" />
                      <span className="font-medium text-vine-dark dark:text-gray-200">{u.username}</span>
                      {u.id === user?.id && (
                        <span className="text-xs bg-vine-100 dark:bg-vine-900/30 text-vine-600 dark:text-vine-400 px-2 py-0.5 rounded">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-vine-sage dark:text-secondary-400 hidden md:table-cell">
                    {u.email || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      disabled={u.id === user?.id}
                      className={`text-sm border border-vine-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-vine-sage dark:text-secondary-400 hidden lg:table-cell">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {showChangePassword === u.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="w-32 text-sm border border-vine-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <button
                            onClick={() => handleChangePassword(u.id)}
                            className="text-green-600 hover:text-green-700 dark:text-green-400"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setShowChangePassword(null); setNewPassword(''); }}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            title="Cancel"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setShowChangePassword(u.id); setNewPassword(''); setUserError(''); setUserSuccess(''); }}
                            className="p-1.5 text-vine-sage hover:text-vine-dark dark:text-secondary-400 dark:hover:text-white transition-colors"
                            title="Change Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="bg-vine-50 dark:bg-gray-800 border border-vine-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-vine-dark dark:text-white mb-2">Role Permissions</h4>
        <ul className="text-sm text-vine-sage dark:text-secondary-400 space-y-1">
          <li><strong>Viewer:</strong> Can view all family data but cannot make changes</li>
          <li><strong>Editor:</strong> Can add and edit members, photos, stories, and recipes</li>
          <li><strong>Admin:</strong> Full access including user management and settings</li>
        </ul>
      </div>
    </div>
  );

  const renderLogoutSettings = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium font-heading text-vine-dark dark:text-white mb-4">
          Sign Out
        </h3>
        <p className="text-vine-sage dark:text-secondary-400 mb-6">
          You will be logged out of FamilyVine and redirected to the login page.
        </p>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Before you go...
        </h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Make sure all your changes are saved</li>
          <li>• Your data will remain secure and accessible when you return</li>
          <li>• You can always log back in with your credentials</li>
        </ul>
      </div>
    </div>
  );

  if (loading || prefsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-transparent transition-colors duration-200">
      <div className="settings-header mb-5">
        <h1 className="settings-header-title">Settings</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}>Manage your FamilyVine preferences and data</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="lg:w-64">
          <nav className="settings-tab-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-tab${activeTab === tab.id ? ' settings-tab-active' : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="settings-content-panel">
            {activeTab === 'account' && renderAccountSettings()}
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'display' && renderDisplaySettings()}
            {activeTab === 'privacy' && renderPrivacySettings()}
            {activeTab === 'tree' && renderTreeSettings()}
            {activeTab === 'users' && user?.role === 'admin' && renderUsersSettings()}
            {activeTab === 'import' && renderImportSettings()}
            {activeTab === 'export' && renderExportSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'logout' && renderLogoutSettings()}

            {/* Save Button - Don't show for account/import/export/users/logout tabs */}
            {activeTab !== 'account' && activeTab !== 'export' && activeTab !== 'import' && activeTab !== 'users' && activeTab !== 'logout' && (
              <div className="mt-8 pt-6 border-t border-vine-200 dark:border-gray-700">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="settings-save-btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="settings-content-panel max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl">
            {/* Modal Header - Sticky */}
            <div className="flex items-center justify-between p-4 border-b border-vine-200 dark:border-gray-700 rounded-t-xl">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>Export Family Data</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-vine-sage hover:text-vine-dark dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 hover:bg-vine-50 dark:hover:bg-gray-700 rounded-full"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <ExportFamilyData
                members={members}
                relationships={relationships}
              />
            </div>

            {/* Modal Footer - Sticky */}
            <div className="p-4 border-t border-vine-200 dark:border-gray-700 bg-vine-50 dark:bg-gray-900 rounded-b-xl flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2 rounded-lg transition-colors"
                style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))', color: '#fffdf9' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;