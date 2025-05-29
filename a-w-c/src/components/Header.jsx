import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiHome,
  FiFileText,
  FiTrendingUp,
  FiHelpCircle,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import UserPanel from "./UserPanel";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    currentUser,
    userProfile,
    logout,
    isAdmin,
    updateUserProfile,
  } = useAuth();

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600 font-bold"
      : "text-gray-700 hover:text-blue-500";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleImageUpload = async (file) => {
    if (!currentUser) throw new Error("No user logged in");

    try {
      const storage = getStorage();
      const imageRef = ref(storage, `profileImages/${currentUser.uid}/${file.name}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      await updateUserProfile({ profileImage: imageUrl });
      return imageUrl;
    } catch (err) {
      console.error("Upload failed:", err);
      throw err;
    }
  };

  return (
    <>
      <header className="bg-white shadow-md relative z-40 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="text-xl sm:text-2xl font-bold text-blue-600">
              AIWriteCheck
            </Link>

            {/* Desktop Nav */}
            {currentUser && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className={`${isActive("/dashboard")} flex items-center`}>
                  <FiHome className="mr-1" /> Dashboard
                </Link>
                <Link to="/analysis" className={`${isActive("/analysis")} flex items-center`}>
                  <FiFileText className="mr-1" /> Text Analysis
                </Link>
                <Link to="/progress" className={`${isActive("/progress")} flex items-center`}>
                  <FiTrendingUp className="mr-1" /> Progress
                </Link>
                <Link to="/help" className={`${isActive("/help")} flex items-center`}>
                  <FiHelpCircle className="mr-1" /> Help
                </Link>
              </nav>
            )}

            {/* Desktop Profile */}
            {currentUser && (
              <div className="hidden md:flex items-center">
                <button
                  onClick={() => setIsAccountPanelOpen(true)}
                  className="p-2 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <FiUser className="text-xl" />
                </button>
              </div>
            )}

            {/* Mobile Toggle */}
            <div className="md:hidden">
              {currentUser && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isMenuOpen ? <FiX /> : <FiMenu />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && currentUser && (
        <div className="md:hidden fixed inset-0 z-30 bg-gradient-to-br from-blue-900 to-blue-700 overflow-y-auto">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-3 rounded-full text-white bg-blue-600 hover:bg-blue-500"
            >
              <FiX />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center space-y-4 pb-12">
            <Link
              to="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="w-4/5 text-white bg-blue-800 hover:bg-blue-600 px-6 py-4 rounded-xl flex items-center justify-center"
            >
              <FiHome className="mr-2" /> Dashboard
            </Link>
            <Link
              to="/analysis"
              onClick={() => setIsMenuOpen(false)}
              className="w-4/5 text-white bg-blue-800 hover:bg-blue-600 px-6 py-4 rounded-xl flex items-center justify-center"
            >
              <FiFileText className="mr-2" /> Text Analysis
            </Link>
            <Link
              to="/progress"
              onClick={() => setIsMenuOpen(false)}
              className="w-4/5 text-white bg-blue-800 hover:bg-blue-600 px-6 py-4 rounded-xl flex items-center justify-center"
            >
              <FiTrendingUp className="mr-2" /> Progress
            </Link>
            <Link
              to="/help"
              onClick={() => setIsMenuOpen(false)}
              className="w-4/5 text-white bg-blue-800 hover:bg-blue-600 px-6 py-4 rounded-xl flex items-center justify-center"
            >
              <FiHelpCircle className="mr-2" /> Help
            </Link>
            <button
              onClick={handleLogout}
              className="w-4/5 text-white bg-red-600 hover:bg-red-500 px-6 py-4 rounded-xl flex items-center justify-center"
            >
              <FiLogOut className="mr-2" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* User Panel */}
      {currentUser && (
        <UserPanel
          isOpen={isAccountPanelOpen}
          onClose={() => setIsAccountPanelOpen(false)}
          currentUser={currentUser}
          isAdmin={isAdmin}
          profileImage={userProfile?.profileImage}
          handleImageUpload={handleImageUpload}
          handleLogout={handleLogout}
        />
      )}
    </>
  );
}

export default Header;
