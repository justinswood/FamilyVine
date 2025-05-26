import React, { useState, useEffect } from 'react';
import { Download, Database, Shield, Bell, Palette, User, Save, Upload } from 'lucide-react';
import ExportFamilyData from '../components/ExportFamilyData';
import CSVImport from './CSVImport'; // Import the CSVImport component
import axios from 'axios';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showExportModal, setShowExportModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    familyName: '',
    defaultPrivacy: 'private',
    autoSaveInterval: 5,
    
    // Display Settings
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
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
    if (tab && ['general', 'display', 'privacy', 'import', 'export', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Apply theme when settings change
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else { // auto
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

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

  const loadSettings = () => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('familyVineSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsed }));
      // Apply theme immediately when loading
      applyTheme(parsed.theme || 'light');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('familyVineSettings', JSON.stringify(settings));
      
      // Apply theme immediately
      applyTheme(settings.theme);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (section, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Apply theme immediately for instant feedback
    if (setting === 'theme') {
      applyTheme(value);
    }
  };

  // Listen for system theme changes if auto mode is selected
  useEffect(() => {
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [settings.theme]);

  const tabs = [
    { id: 'general', label: 'General', icon: <Database className="w-4 h-4" /> },
    { id: 'display', label: 'Display', icon: <Palette className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
    { id: 'import', label: 'Import Data', icon: <Upload className="w-4 h-4" /> }, // NEW TAB
    { id: 'export', label: 'Export Data', icon: <Download className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Family Name
        </label>
        <input
          type="text"
          value={settings.familyName}
          onChange={(e) => handleSettingChange('general', 'familyName', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="Enter your family name"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This will appear in exported documents and reports
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Default Privacy Level
        </label>
        <select
          value={settings.defaultPrivacy}
          onChange={(e) => handleSettingChange('general', 'defaultPrivacy', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="public">Public - Visible to everyone</option>
          <option value="family">Family Only - Visible to family members</option>
          <option value="private">Private - Visible only to you</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Auto-save Interval (minutes)
        </label>
        <select
          value={settings.autoSaveInterval}
          onChange={(e) => handleSettingChange('general', 'autoSaveInterval', parseInt(e.target.value))}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value={1}>1 minute</option>
          <option value={5}>5 minutes</option>
          <option value={10}>10 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={0}>Disabled</option>
        </select>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date Format
        </label>
        <select
          value={settings.dateFormat}
          onChange={(e) => handleSettingChange('display', 'dateFormat', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY (American)</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY (European)</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          <option value="MMM DD, YYYY">MMM DD, YYYY (Long format)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme
        </label>
        <select
          value={settings.theme}
          onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="light">Light Theme</option>
          <option value="dark">Dark Theme</option>
          <option value="auto">Auto (System Preference)</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {settings.theme === 'auto' 
            ? 'Theme will match your system preference' 
            : `Currently using ${settings.theme} theme`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Language
        </label>
        <select
          value={settings.language}
          onChange={(e) => handleSettingChange('display', 'language', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Private Information</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Include email addresses and phone numbers in exports</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showPrivateInfo}
            onChange={(e) => handleSettingChange('privacy', 'showPrivateInfo', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Require Login for Viewing</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Users must log in to view family tree</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requireLoginForViewing}
            onChange={(e) => handleSettingChange('privacy', 'requireLoginForViewing', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Guest Access</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Allow viewing without creating an account</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowGuestAccess}
            onChange={(e) => handleSettingChange('privacy', 'allowGuestAccess', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  // NEW: Import Data tab content
  const renderImportSettings = () => (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Import Family Data</h3>
        <p className="text-green-700 dark:text-green-300 text-sm mb-4">
          Import family members from CSV files or other data sources to quickly build your family tree.
        </p>
      </div>

      {/* CSV Import Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <CSVImport />
      </div>

      {/* Future import options placeholder */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Coming Soon</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Export Your Family Data</h3>
        <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
          Export your family tree in various formats for backup, sharing, or importing into other applications.
        </p>
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Open Export Tool
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Available Formats</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• CSV - Spreadsheet format</li>
            <li>• JSON - Structured data</li>
            <li>• GEDCOM - Genealogy standard</li>
            <li>• PDF - Printable reports</li>
          </ul>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Export Options</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Receive email updates about family tree changes</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Member Updates</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when member information is updated</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.memberUpdates}
            onChange={(e) => handleSettingChange('notifications', 'memberUpdates', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Relationship Changes</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Alerts when relationships are added or modified</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.relationshipChanges}
            onChange={(e) => handleSettingChange('notifications', 'relationshipChanges', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Photo Uploads</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Notifications when new photos are added</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.photoUploads}
            onChange={(e) => handleSettingChange('notifications', 'photoUploads', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 dark:bg-gray-900 transition-colors duration-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your FamilyVine preferences and data</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'display' && renderDisplaySettings()}
            {activeTab === 'privacy' && renderPrivacySettings()}
            {activeTab === 'import' && renderImportSettings()}
            {activeTab === 'export' && renderExportSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}

            {/* Save Button - Don't show for import/export tabs */}
            {activeTab !== 'export' && activeTab !== 'import' && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4">
            <ExportFamilyData
              members={members}
              relationships={relationships}
            />
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowExportModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
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