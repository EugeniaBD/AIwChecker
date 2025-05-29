import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Import Link
import { useAuth } from "../contexts/AuthContext";
import {
  FiMenu,
  FiX,
  FiHome,
  FiFileText,
  FiTrendingUp,
  FiHelpCircle,
  FiLogOut,
  FiUser,
  FiChevronRight,
  FiCamera,
} from "react-icons/fi";
import { uploadProfileImage } from "../utils/firebaseUtils"; // Import helper function for uploading images

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const { currentUser, logout, isAdmin, updateUserProfile } = useAuth(); // Use updateUserProfile to update profile data in Firestore
  const location = useLocation();
  const navigate = useNavigate();

  // Load the stored profile image from Firestore when the component mounts
  useEffect(() => {
    if (currentUser && currentUser.profileImage) {
      setProfileImage(currentUser.profileImage); // Set the profile image URL if it exists
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Handle profile image upload and update the profile
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];

    if (file && file.type.startsWith("image/")) {
      try {
        // Upload image to Firebase Storage and get its URL
        const imageUrl = await uploadProfileImage(file, currentUser.uid);

        // Update profile with the new image URL
        setProfileImage(imageUrl);

        // Update the user's profile in Firestore with the new image URL
        await updateUserProfile({ profileImage: imageUrl });
      } catch (error) {
        console.error("Error uploading profile image", error);
      }
    }
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600 font-bold"
      : "text-gray-700 hover:text-blue-500";

  const isMobileActive = (path) =>
    location.pathname === path
      ? "bg-blue-600 text-white font-bold shadow-lg"
      : "text-white bg-blue-800 bg-opacity-70 hover:bg-blue-700";

  return (
    <>
      <header className="bg-white shadow-md relative z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to={currentUser ? "/dashboard" : "/login"}
                className="flex items-center"
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  AIWriteCheck
                </span>
              </Link>
            </div>

            {currentUser && (
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/dashboard" className={`${isActive("/dashboard")} px-3 py-2 flex items-center`}>
                  <FiHome className="mr-1" /> Dashboard
                </Link>
                <Link to="/analysis" className={`${isActive("/analysis")} px-3 py-2 flex items-center`}>
                  <FiFileText className="mr-1" /> Text Analysis
                </Link>
                <Link to="/progress" className={`${isActive("/progress")} px-3 py-2 flex items-center`}>
                  <FiTrendingUp className="mr-1" /> Progress
                </Link>
                <Link to="/help" className={`${isActive("/help")} px-3 py-2 flex items-center`}>
                  <FiHelpCircle className="mr-1" /> Help
                </Link>
              </div>
            )}

            <div className="hidden md:flex items-center space-x-3">
              {currentUser && (
                <button
                  onClick={() => setIsAccountPanelOpen(true)}
                  className="p-2 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50 focus:outline-none"
                >
                  <FiUser className="text-xl" />
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center">
              {currentUser && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow"
                >
                  {!isMenuOpen ? <FiMenu /> : <FiX />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && currentUser && (
        <div className="md:hidden fixed inset-0 z-30 bg-gradient-to-br from-blue-900 to-blue-700">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-3 rounded-full text-white bg-blue-600 hover:bg-blue-500"
            >
              <FiX />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center h-full -mt-20">
            <div className="w-4/5 max-w-sm space-y-4">
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className={`${isMobileActive("/dashboard")} px-6 py-4 rounded-xl flex items-center justify-center`}>
                <FiHome className="mr-2" /> Dashboard
              </Link>
              <Link to="/analysis" onClick={() => setIsMenuOpen(false)} className={`${isMobileActive("/analysis")} px-6 py-4 rounded-xl flex items-center justify-center`}>
                <FiFileText className="mr-2" /> Text Analysis
              </Link>
              <Link to="/progress" onClick={() => setIsMenuOpen(false)} className={`${isMobileActive("/progress")} px-6 py-4 rounded-xl flex items-center justify-center`}>
                <FiTrendingUp className="mr-2" /> Progress
              </Link>
              <Link to="/help" onClick={() => setIsMenuOpen(false)} className={`${isMobileActive("/help")} px-6 py-4 rounded-xl flex items-center justify-center`}>
                <FiHelpCircle className="mr-2" /> Help
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Account Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white border-l z-50 shadow-xl transition-transform duration-300 ${
          isAccountPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">My Account</h2>
          <button
            onClick={() => setIsAccountPanelOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={profileImage || "/default-avatar.png"}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border"
              />
              <label className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow cursor-pointer">
                <FiCamera />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-md font-semibold mt-2">{currentUser?.displayName || "Unnamed"}</p>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
          </div>

          <Link to="/settings" onClick={() => setIsAccountPanelOpen(false)} className="flex items-center justify-between px-4 py-2 border rounded-md text-blue-600 hover:bg-blue-50">
            <span>Settings</span> <FiChevronRight />
          </Link>

          <Link to="/subscription" onClick={() => setIsAccountPanelOpen(false)} className="flex items-center justify-between px-4 py-2 border rounded-md text-blue-600 hover:bg-blue-50">
            <span>Subscription</span> <FiChevronRight />
          </Link>

          {isAdmin && (
            <Link to="/admin" onClick={() => setIsAccountPanelOpen(false)} className="flex items-center justify-between px-4 py-2 border rounded-md text-red-600 hover:bg-red-50">
              <span>Admin Panel</span> <FiChevronRight />
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
          >
            <FiLogOut className="mr-2" /> Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default Header;
