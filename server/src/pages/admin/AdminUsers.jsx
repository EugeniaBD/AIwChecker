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
import { db } from '../../contexts/AuthContext';

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
    // Reset the pagination when filters change
    setLastVisible(null);
    fetchUsers();
  }, [filterRole, filterStatus, sortBy, sortDirection]);

  async function fetchUsers(isLoadMore = false) {
    try {
      setLoading(!isLoadMore);
      if (isLoadMore) setIsLoadingMore(true);

      let usersRef = collection(db, "users");
      let usersQuery = query(usersRef);

      // Apply filters
      if (filterRole !== "all") {
        // Make sure we're using the exact string value stored in the database
        usersQuery = query(usersQuery, where("role", "==", filterRole));
      }

      if (filterStatus !== "all") {
        const isActive = filterStatus === "active";
        usersQuery = query(usersQuery, where("isActive", "==", isActive));
      }

      // Apply sorting
      usersQuery = query(usersQuery, orderBy(sortBy, sortDirection));

      // Pagination
      if (isLoadMore && lastVisible) {
        usersQuery = query(
          usersQuery,
          startAfter(lastVisible),
          limit(usersPerPage)
        );
      } else {
        usersQuery = query(usersQuery, limit(usersPerPage));
      }

      const usersSnapshot = await getDocs(usersQuery);
      
      // Check if we got any results
      if (usersSnapshot.empty && !isLoadMore) {
        setUsers([]);
        setHasMore(false);
        setLastVisible(null);
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }
      
      const lastVisibleDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];

      // Check if there are more users to load
      setHasMore(usersSnapshot.docs.length === usersPerPage);

      // Update lastVisible document
      setLastVisible(lastVisibleDoc);

      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // If loading more, append to existing list
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
    // Pagination reset is now handled in the useEffect
  }

  function handleSortChange(field) {
    if (sortBy === field) {
      // Toggle sort direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
    // Pagination reset is now handled in the useEffect
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
      await updateDoc(userRef, {
        role: newRole,
      });

      // Update the user in the state
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
      await updateDoc(userRef, {
        isActive: newStatus,
      });

      // Update the user in the state
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

        // Remove the user from the state
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

        // Close modal if the deleted user is selected
        if (selectedUser && selectedUser.id === userId) {
          closeUserModal();
        }
      } catch (err) {
        console.error("Error deleting user:", err);
        setError("Failed to delete user. Please try again.");
      }
    }
  }

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term))
    );
  });

  // Complete the loading animation in the table
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
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{user.email}</div>
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
            : typeof user.createdAt === 'string' 
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

  // Create the User Details Modal component
  function UserDetailsModal() {
    if (!selectedUser || !isModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">User Details</h2>
            <button
              onClick={closeUserModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                {selectedUser.name
                  ? selectedUser.name.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div>
                <p className="font-medium">{selectedUser.name || "No Name"}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  value={selectedUser.role || "user"}
                  onChange={(e) =>
                    updateUserRole(selectedUser.id, e.target.value)
                  }
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
                      selectedUser.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                    onClick={() =>
                      toggleUserStatus(selectedUser.id, selectedUser.isActive)
                    }
                  >
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-2">Joined</p>
            <p>
              {selectedUser.createdAt?.toDate?.().toLocaleDateString() ||
                (typeof selectedUser.createdAt === 'string' 
                  ? new Date(selectedUser.createdAt).toLocaleDateString()
                  : "Unknown")}
            </p>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => deleteUser(selectedUser.id)}
            >
              Delete User
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={closeUserModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div>
              <label
                htmlFor="roleFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <select
                id="roleFilter"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={filterRole}
                onChange={(e) => handleFilterChange("role", e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="statusFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={filterStatus}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                id="search"
                type="text"
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("name")}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy === "name" && (
                      <i
                        className={`fas fa-sort-${
                          sortDirection === "asc" ? "up" : "down"
                        } ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("email")}
                >
                  <div className="flex items-center">
                    Email
                    {sortBy === "email" && (
                      <i
                        className={`fas fa-sort-${
                          sortDirection === "asc" ? "up" : "down"
                        } ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("role")}
                >
                  <div className="flex items-center">
                    Role
                    {sortBy === "role" && (
                      <i
                        className={`fas fa-sort-${
                          sortDirection === "asc" ? "up" : "down"
                        } ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("isActive")}
                >
                  <div className="flex items-center">
                    Status
                    {sortBy === "isActive" && (
                      <i
                        className={`fas fa-sort-${
                          sortDirection === "asc" ? "up" : "down"
                        } ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange("createdAt")}
                >
                  <div className="flex items-center">
                    Joined
                    {sortBy === "createdAt" && (
                      <i
                        className={`fas fa-sort-${
                          sortDirection === "asc" ? "up" : "down"
                        } ml-1`}
                      ></i>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableBodyContent}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {!loading && hasMore && (
          <div className="px-6 py-4 flex justify-center">
            <button
              onClick={loadMoreUsers}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isLoadingMore ? (
                <span className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Loading...
                </span>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <UserDetailsModal />
    </div>
  );
}

export default AdminUsers;