import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiX,
  FiChevronRight,
  FiCamera,
  FiLogOut,
  FiSettings, 
} from "react-icons/fi";

function UserPanel({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  profileImage,
  handleImageUpload,
  handleLogout,
}) {
  const [localImage, setLocalImage] = useState(profileImage || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocalImage(profileImage);
  }, [profileImage]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadedUrl = await handleImageUpload(file);
      if (!uploadedUrl) throw new Error("No image URL returned from upload.");
      setLocalImage(uploadedUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-white border-l z-50 shadow-xl transition-transform duration-300 overflow-y-auto ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">My Account</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring" aria-label="Close panel">
          <FiX />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={localImage || "/default-avatar.png"}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border"
            />
            <label className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow cursor-pointer">
              <FiCamera />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {uploading && <p className="text-xs text-gray-500 mt-2">Uploading...</p>}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

          <p className="text-md font-semibold mt-2">
            {currentUser?.displayName || "Unnamed"}
          </p>
          <p className="text-sm text-gray-500 break-all">{currentUser?.email}</p>
        </div>

        <Link to="/settings" onClick={onClose} className="flex items-center justify-between px-4 py-2 border rounded-md text-blue-600 hover:bg-blue-50">
          <span>⚙️Settings</span> <FiChevronRight />
        </Link>

        <Link to="/subscription" onClick={onClose} className="flex items-center justify-between px-4 py-2 border rounded-md text-blue-600 hover:bg-blue-50">
          <span>🧾 Subscription</span> <FiChevronRight />
        </Link>

        {isAdmin && (
          <>
            <Link to="/admin" onClick={onClose} className="flex items-center justify-between px-4 py-2 border rounded-md text-red-600 hover:bg-red-50">
              <span>👤 Admin Panel</span> <FiChevronRight />
            </Link>

            <Link to="/admin/settings" onClick={onClose} className="flex items-center justify-between px-4 py-2 border rounded-md text-blue-600 hover:bg-blue-50">
              <span className="flex items-center gap-2">
                <FiSettings /> System Settings
              </span>
              <FiChevronRight />
            </Link>
          </>
        )}

        <button
          onClick={handleLogout}
          className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center focus:outline-none focus:ring"
        >
          <FiLogOut className="mr-2" /> Logout
        </button>
      </div>
    </div>
  );
}

export default UserPanel;
