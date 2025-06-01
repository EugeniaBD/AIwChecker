import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  startAfter,
  limit,
} from "firebase/firestore";
import { db } from "../../contexts/AuthContext";
import UserDetailsModal from "./modals/UserDetailsModal";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [lastVisible, setLastVisible] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const usersPerPage = 10;

  useEffect(() => {
    setLastVisible(null);
    fetchUsers();
  }, [filterRole, filterStatus, sortBy, sortDirection]);

async function fetchUsers(isLoadMore = false) {
  try {
    setLoading(!isLoadMore);
    if (isLoadMore) setIsLoadingMore(true);

    const usersRef = collection(db, "users");

    // Build the filters
    const constraints = [];

    if (filterRole !== "all") {
      constraints.push(where("role", "==", filterRole));
    }

    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      constraints.push(where("isActive", "==", isActive));
    }

    constraints.push(orderBy(sortBy, sortDirection));

    if (isLoadMore && lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    constraints.push(limit(usersPerPage));

    const usersQuery = query(usersRef, ...constraints);

    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty && !isLoadMore) {
      setUsers([]);
      setHasMore(false);
      setLastVisible(null);
      setLoading(false);
      setIsLoadingMore(false);
      return;
    }

    const lastVisibleDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
    setHasMore(usersSnapshot.docs.length === usersPerPage);
    setLastVisible(lastVisibleDoc);

    const usersData = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (isLoadMore) {
      setUsers((prevUsers) => [...prevUsers, ...usersData]);
    } else {
      setUsers(usersData);
    }
  } catch (err) {
    console.error("Error fetching users:", err);
    setError("Failed to load users. Please try again later.");
  } finally {
    setLoading(false);
    setIsLoadingMore(false);
  }
}

  async function loadMoreUsers() {
    if (!isLoadingMore && hasMore) {
      await fetchUsers(true);
    }
  }

  function handleSearch(e) {
    setSearchTerm(e.target.value);
  }

  function handleFilterChange(filterType, value) {
    if (filterType === "role") {
      setFilterRole(value);
    } else if (filterType === "status") {
      setFilterStatus(value);
    }
  }

  function handleSortChange(field) {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  }

  function openUserModal(user) {
    setSelectedUser(user);
    setIsModalOpen(true);
  }

  function closeUserModal() {
    setSelectedUser(null);
    setIsModalOpen(false);
  }

  async function updateUserRole(userId, newRole) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (err) {
      console.error("Error updating user role:", err);
      setError("Failed to update user role. Please try again.");
    }
  }

  async function toggleUserStatus(userId, currentStatus) {
    try {
      const userRef = doc(db, "users", userId);
      const newStatus = !currentStatus;
      await updateDoc(userRef, { isActive: newStatus });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isActive: newStatus } : user
        )
      );

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, isActive: newStatus });
      }
    } catch (err) {
      console.error("Error updating user status:", err);
      setError("Failed to update user status. Please try again.");
    }
  }

  async function deleteUser(userId) {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);

        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

        if (selectedUser && selectedUser.id === userId) {
          closeUserModal();
        }
      } catch (err) {
        console.error("Error deleting user:", err);
        setError("Failed to delete user. Please try again.");
      }
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term))
    );
  });

  const tableBodyContent = loading ? (
    <tr>
      <td colSpan="6" className="px-6 py-4 text-center">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      </td>
    </tr>
  ) : filteredUsers.length === 0 ? (
    <tr>
      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
        No users found. Try adjusting your filters.
      </td>
    </tr>
  ) : (
    filteredUsers.map((user) => (
      <tr key={user.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {user.name || "No Name"}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {user.email}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              user.role === "admin"
                ? "bg-purple-100 text-purple-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {user.role || "user"}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              user.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user.createdAt?.toDate
            ? user.createdAt.toDate().toLocaleDateString()
            : typeof user.createdAt === "string"
            ? new Date(user.createdAt).toLocaleDateString()
            : "Unknown"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => openUserModal(user)}
            className="text-blue-600 hover:text-blue-900 mr-3"
          >
            View
          </button>
          <button
            onClick={() => toggleUserStatus(user.id, user.isActive)}
            className={`${
              user.isActive
                ? "text-red-600 hover:text-red-900"
                : "text-green-600 hover:text-green-900"
            } mr-3`}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => deleteUser(user.id)}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </td>
      </tr>
    ))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => handleFilterChange("role", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["name", "email", "role", "isActive", "createdAt"].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange(col)}
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                    {sortBy === col && (
                      <i
                        className={`fas fa-sort-${sortDirection === "asc" ? "up" : "down"} ml-1`}
                      ></i>
                    )}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableBodyContent}
            </tbody>
          </table>
        </div>

        {!loading && hasMore && (
          <div className="px-6 py-4 flex justify-center">
            <button
              onClick={loadMoreUsers}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {/* User Modal Component */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={closeUserModal}
        onToggleStatus={toggleUserStatus}
        onRoleChange={updateUserRole}
        onDelete={deleteUser}
      />
    </div>
  );
}

export default AdminUsers;
