import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../contexts/AuthContext";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

function Settings() {
  const {
    currentUser,
    updateUserProfile,
    updateUserPassword
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [storedPassword, setStoredPassword] = useState(""); // Simulated, will depend on your backend structure.

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [tipNotifications, setTipNotifications] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setName(userData.name || "");
          setEmail(currentUser.email || "");
          setStoredPassword(userData.password || ""); // Assuming stored password (Note: Never store plain text password in real apps)

          if (userData.notificationPreferences) {
            setEmailNotifications(
              userData.notificationPreferences.emailNotifications ?? true
            );
            setWeeklyReports(
              userData.notificationPreferences.weeklyReports ?? true
            );
            setTipNotifications(
              userData.notificationPreferences.tipNotifications ?? true
            );
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load your settings");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [currentUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      await updateUserProfile({ name });

      setSuccess("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Check if all fields are filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setError("Please complete all password fields.");
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      // Reauthenticate the user with the current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // If successful, proceed to change password
      await updatePassword(currentUser, newPassword);

      // After changing password, you may want to store the new password securely in Firestore (though passwords should not be stored in plaintext).
      // await updateDoc(doc(db, "users", currentUser.uid), {
      //   password: newPassword // Be careful! Storing passwords in plaintext is not recommended.
      // });

      // Clear password fields and show success message
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else {
        setError("Failed to update password: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      await updateUserProfile({
        notificationPreferences: {
          emailNotifications,
          weeklyReports,
          tipNotifications,
        },
      });

      setSuccess("Notification preferences updated");
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      setError("Failed to update notification preferences: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !name) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-blue-600 text-4xl mb-4"></i>
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Account Settings</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <i className="fas fa-exclamation-circle mr-2"></i> {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <i className="fas fa-check-circle mr-2"></i> {success}
        </div>
      )}

      {/* Profile Update */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Profile Information</h2>
        <form onSubmit={handleProfileUpdate}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              value={email}
              disabled
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Update Profile
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="mb-4">
            <label htmlFor="current-password" className="block text-gray-700 font-medium mb-2">Current Password</label>
            <input
              id="current-password"
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="new-password" className="block text-gray-700 font-medium mb-2">New Password</label>
            <input
              id="new-password"
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirm-password" className="block text-gray-700 font-medium mb-2">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Change Password
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Notification Preferences</h2>
        <form onSubmit={handleNotificationUpdate}>
          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <input
                id="email-notifications"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <label htmlFor="email-notifications" className="ml-3 text-gray-700">
                Email notifications about analysis results
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="weekly-reports"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={weeklyReports}
                onChange={(e) => setWeeklyReports(e.target.checked)}
              />
              <label htmlFor="weekly-reports" className="ml-3 text-gray-700">
                Weekly progress reports
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="tip-notifications"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={tipNotifications}
                onChange={(e) => setTipNotifications(e.target.checked)}
              />
              <label htmlFor="tip-notifications" className="ml-3 text-gray-700">
                Writing tips and improvement suggestions
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Update Preferences
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
