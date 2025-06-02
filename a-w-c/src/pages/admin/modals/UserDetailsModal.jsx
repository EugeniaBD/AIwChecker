// src/pages/admin/modals/UserDetailsModal.jsx
import React from "react";
import { FaTimes } from "react-icons/fa";
import "../../../styles/UserDetailsModal.css";

function UserDetailsModal({ user, isOpen, onClose, onToggleStatus, onRoleChange, onDelete }) {
  if (!user || !isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>User Details</h2>
          <button onClick={onClose} className="modal-close-button">
            <FaTimes />
          </button>
        </div>

        <div className="modal-user-info">
          <div className="modal-user-row">
            <div className="modal-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="modal-user-name">{user.name || "No Name"}</p>
              <p className="modal-user-email">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <div className="modal-grid">
            <div>
              <p className="modal-field-label">Role</p>
              <select
                className="modal-select"
                value={user.role || "user"}
                onChange={(e) => onRoleChange(user.id, e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <p className="modal-field-label">Status</p>
              <div className="modal-status-wrapper">
                <button
                  className={`modal-status-button ${
                    user.isActive ? "modal-status-active" : "modal-status-inactive"
                  }`}
                  onClick={() => onToggleStatus(user.id, user.isActive)}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <p className="modal-field-label">Joined</p>
          <p>
            {user.createdAt?.toDate?.().toLocaleDateString() ||
              (typeof user.createdAt === "string"
                ? new Date(user.createdAt).toLocaleDateString()
                : "Unknown")}
          </p>
        </div>

        <div className="modal-footer">
          <button
            className="modal-delete-button"
            onClick={() => onDelete(user.id)}
          >
            Delete User
          </button>
          <button
            className="modal-close-footer-button"
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
