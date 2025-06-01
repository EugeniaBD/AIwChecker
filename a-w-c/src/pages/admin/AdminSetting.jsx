// File: src/pages/admin/AdminSettings.js
import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';

function AdminSettings() {
  const [settings, setSettings] = useState({
    appName: 'AI Write Check',
    maxUploadSize: 5,
    defaultUserRole: 'user',
    allowUserRegistration: true,
    maintenanceMode: false,
    premiumFeatures: {
      enableBulkAnalysis: true,
      enableExport: true,
      enableAdvancedMetrics: true
    },
    emailSettings: {
      sendWelcomeEmail: true,
      sendAnalysisCompletedEmail: true,
      adminNotifications: true
    },
    retention: {
      userDataDays: 90,
      analysisDataDays: 30
    },
    apiKeys: {
      currentKey: '••••••••••••••••',
      lastRotated: '2025-01-15'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const settingsRef = doc(db, 'system', 'settings');
        const settingsSnapshot = await getDoc(settingsRef);
        
        if (settingsSnapshot.exists()) {
          setSettings(settingsSnapshot.data());
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings. Please try again later.");
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [category, field] = name.split('.');
      setSettings(prevSettings => ({
        ...prevSettings,
        [category]: {
          ...prevSettings[category],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle top-level properties
      setSettings(prevSettings => ({
        ...prevSettings,
        [name]: type === 'checkbox' ? checked : 
               type === 'number' ? parseFloat(value) : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');
      
      const settingsRef = doc(db, 'system', 'settings');
      await updateDoc(settingsRef, settings);
      
      setSuccessMessage('Settings saved successfully.');
      setSaving(false);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
      setSaving(false);
    }
  };

  const regenerateApiKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate the API key? All existing connections will need to be updated.')) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Generate new API key (in a real app, this would be more secure)
      const newKey = Array(24)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('');
      
      // Update settings
      const updatedSettings = {
        ...settings,
        apiKeys: {
          currentKey: newKey,
          lastRotated: new Date().toISOString().split('T')[0]
        }
      };
      
      const settingsRef = doc(db, 'system', 'settings');
      await updateDoc(settingsRef, updatedSettings);
      
      setSettings(updatedSettings);
      setSuccessMessage('API key regenerated successfully.');
      setSaving(false);
    } catch (err) {
      console.error("Error regenerating API key:", err);
      setError("Failed to regenerate API key. Please try again.");
      setSaving(false);
    }
  };

  const resetSystem = async () => {
    if (!window.confirm('Are you absolutely sure you want to reset the system to default settings? This cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const defaultSettings = {
        appName: 'AI Write Check',
        maxUploadSize: 5,
        defaultUserRole: 'user',
        allowUserRegistration: true,
        maintenanceMode: false,
        premiumFeatures: {
          enableBulkAnalysis: true,
          enableExport: true,
          enableAdvancedMetrics: true
        },
        emailSettings: {
          sendWelcomeEmail: true,
          sendAnalysisCompletedEmail: true,
          adminNotifications: true
        },
        retention: {
          userDataDays: 90,
          analysisDataDays: 30
        },
        apiKeys: {
          currentKey: Array(24).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          lastRotated: new Date().toISOString().split('T')[0]
        }
      };
      
      const settingsRef = doc(db, 'system', 'settings');
      await updateDoc(settingsRef, defaultSettings);
      
      setSettings(defaultSettings);
      setSuccessMessage('System reset to default settings successfully.');
      setSaving(false);
    } catch (err) {
      console.error("Error resetting system:", err);
      setError("Failed to reset system. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">System Settings</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">General Settings</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-1">
                Application Name
              </label>
              <input
                type="text"
                id="appName"
                name="appName"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={settings.appName}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="maxUploadSize" className="block text-sm font-medium text-gray-700 mb-1">
                Max Upload Size (MB)
              </label>
              <input
                type="number"
                id="maxUploadSize"
                name="maxUploadSize"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={settings.maxUploadSize}
                onChange={handleInputChange}
                min="1"
                max="50"
              />
            </div>
            
            <div>
              <label htmlFor="defaultUserRole" className="block text-sm font-medium text-gray-700 mb-1">
                Default User Role
              </label>
              <select
                id="defaultUserRole"
                name="defaultUserRole"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={settings.defaultUserRole}
                onChange={handleInputChange}
              >
                <option value="user">User</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowUserRegistration"
                name="allowUserRegistration"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.allowUserRegistration}
                onChange={handleInputChange}
              />
              <label htmlFor="allowUserRegistration" className="ml-2 block text-sm text-gray-700">
                Allow User Registration
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceMode"
                name="maintenanceMode"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.maintenanceMode}
                onChange={handleInputChange}
              />
              <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
                Maintenance Mode
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Premium Features</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableBulkAnalysis"
                name="premiumFeatures.enableBulkAnalysis"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.premiumFeatures.enableBulkAnalysis}
                onChange={handleInputChange}
              />
              <label htmlFor="enableBulkAnalysis" className="ml-2 block text-sm text-gray-700">
                Enable Bulk Analysis
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableExport"
                name="premiumFeatures.enableExport"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.premiumFeatures.enableExport}
                onChange={handleInputChange}
              />
              <label htmlFor="enableExport" className="ml-2 block text-sm text-gray-700">
                Enable Export Features
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableAdvancedMetrics"
                name="premiumFeatures.enableAdvancedMetrics"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.premiumFeatures.enableAdvancedMetrics}
                onChange={handleInputChange}
              />
              <label htmlFor="enableAdvancedMetrics" className="ml-2 block text-sm text-gray-700">
                Enable Advanced Metrics
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Email Settings</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendWelcomeEmail"
                name="emailSettings.sendWelcomeEmail"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.emailSettings.sendWelcomeEmail}
                onChange={handleInputChange}
              />
              <label htmlFor="sendWelcomeEmail" className="ml-2 block text-sm text-gray-700">
                Send Welcome Email
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendAnalysisCompletedEmail"
                name="emailSettings.sendAnalysisCompletedEmail"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.emailSettings.sendAnalysisCompletedEmail}
                onChange={handleInputChange}
              />
              <label htmlFor="sendAnalysisCompletedEmail" className="ml-2 block text-sm text-gray-700">
                Send Analysis Completed Email
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="adminNotifications"
                name="emailSettings.adminNotifications"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.emailSettings.adminNotifications}
                onChange={handleInputChange}
              />
              <label htmlFor="adminNotifications" className="ml-2 block text-sm text-gray-700">
                Enable Admin Notifications
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Data Retention</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="userDataDays" className="block text-sm font-medium text-gray-700 mb-1">
                User Data Retention (days)
              </label>
              <input
                type="number"
                id="userDataDays"
                name="retention.userDataDays"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={settings.retention.userDataDays}
                onChange={handleInputChange}
                min="1"
              />
            </div>
            
            <div>
              <label htmlFor="analysisDataDays" className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Data Retention (days)
              </label>
              <input
                type="number"
                id="analysisDataDays"
                name="retention.analysisDataDays"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={settings.retention.analysisDataDays}
                onChange={handleInputChange}
                min="1"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">API Configuration</h2>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Current API Key
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="apiKey"
                  className="px-3 py-2 border border-gray-300 rounded-md w-full bg-gray-100"
                  value={settings.apiKeys.currentKey}
                  readOnly
                />
                <button
                  type="button"
                  onClick={regenerateApiKey}
                  className="ml-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Last rotated on: {settings.apiKeys.lastRotated}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={resetSystem}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Reset to Default
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;