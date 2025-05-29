// src/pages/admin/modals/UserDetailsModal.jsx
import React from "react";
import { FaTimes } from "react-icons/fa";

function UserDetailsModal({ user, isOpen, onClose, onToggleStatus, onRoleChange, onDelete }) {
  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">User Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="font-medium">{user.name || "No Name"}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                value={user.role || "user"}
                onChange={(e) => onRoleChange(user.id, e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-1">
                <button
                  className={`px-3 py-2 rounded-md w-full ${
                    user.isActive
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                  onClick={() => onToggleStatus(user.id, user.isActive)}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500 mb-2">Joined</p>
          <p>
            {user.createdAt?.toDate?.().toLocaleDateString() ||
              (typeof user.createdAt === "string"
                ? new Date(user.createdAt).toLocaleDateString()
                : "Unknown")}
          </p>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => onDelete(user.id)}
          >
            Delete User
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDetailsModal;
