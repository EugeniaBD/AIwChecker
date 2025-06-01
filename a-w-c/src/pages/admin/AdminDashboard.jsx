import React, { useState, useEffect } from 'react';
import {
  FaArrowLeft,
  FaSlidersH,
  FaFileExport,
  FaBell,
  FaChartPie,
  FaUserFriends,
  FaUserClock,
  FaFileAlt,
  FaArrowRight
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAnalyses: 0,
    premiumUsers: 0
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        setLoading(true);

        // Get users from Firestore
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const allUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Create a map of userId to userName for quick lookup
        const userMap = new Map();
        allUsers.forEach(user => {
          userMap.set(user.id, user.name || 'Unknown');
        });

        const nonDeactivatedUsers = allUsers.filter(
          user => user.status !== 'deactivated'
        );

        const activeUsersList = nonDeactivatedUsers.filter(
          user => user.isActive !== false
        );

        const totalUsers = nonDeactivatedUsers.length;
        const premiumUsers = nonDeactivatedUsers.filter(
          user => user.plan?.toLowerCase() === 'premium'
        ).length;

        const activeUsers = activeUsersList.length;
        const activeUserIds = new Set(activeUsersList.map(u => u.id));

        const submissionsRef = collection(db, 'submissions');
        const submissionsSnapshot = await getDocs(submissionsRef);
        const allSubmissions = submissionsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            userId: typeof data.userId === 'object' && data.userId?.id
              ? data.userId.id
              : data.userId
          };
        });

        // Filter the submissions to only include those from active users
        const totalAnalyses = allSubmissions.filter(sub =>
          sub.userId && activeUserIds.has(sub.userId)
        ).length;

        setStats({ totalUsers, activeUsers, totalAnalyses, premiumUsers });

        const recentUsersQuery = query(
          usersRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsersData = recentUsersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.status !== 'deactivated');
        setRecentUsers(recentUsersData);

        const recentSubmissionsQuery = query(
          submissionsRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSubmissionsSnapshot = await getDocs(recentSubmissionsQuery);
        const recentSubmissionsData = recentSubmissionsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            userId: typeof data.userId === 'object' && data.userId?.id
              ? data.userId.id
              : data.userId
          };
        });

        // Filter recent submissions to include only active users' submissions
        const recentActiveSubmissions = recentSubmissionsData.filter(sub =>
          activeUserIds.has(sub.userId)
        );

        // Add user names to the submissions
        const recentActiveSubmissionsWithUserNames = recentActiveSubmissions.map(sub => ({
          ...sub,
          userName: userMap.get(sub.userId) // Fetch the userName from the userMap
        }));

        setRecentSubmissions(recentActiveSubmissionsWithUserNames);

        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching admin data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    }

    fetchAdminData();
  }, []);  // Empty dependency array ensures this runs once when the component mounts.

  // Function to format the createdAt date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short', // Day of the week (e.g., Mon)
      year: 'numeric',
      month: 'short',  // Month abbreviation (e.g., May)
      day: 'numeric'   // Day of the month (e.g., 17)
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex gap-4">
          <Link
            to="/admin/reports"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow hover:bg-indigo-700 transition duration-150"
          >
            <FaChartPie className="mr-2" /> Reports
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow hover:bg-emerald-700 transition duration-150"
          >
            <FaUserFriends className="mr-2" /> Users
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[{
          icon: 'users',
          color: 'blue',
          label: 'Total Users',
          value: stats.totalUsers
        },
        {
          icon: 'user-check',
          color: 'green',
          label: 'Active Users',
          value: stats.activeUsers
        },
        {
          icon: 'crown',
          color: 'purple',
          label: 'Premium Users',
          value: stats.premiumUsers
        },
        {
          icon: 'file-alt',
          color: 'yellow',
          label: 'Total Analyses',
          value: stats.totalAnalyses
        }].map((item, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-200"
          >
            <div className="flex items-center">
              <div className={`bg-${item.color}-100 p-3 rounded-full`}>
                <i className={`fas fa-${item.icon} text-${item.color}-600 text-xl`}></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm text-gray-500">{item.label}</h3>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users & Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card-section bg-white rounded-xl shadow-sm border">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaUserClock className="text-blue-500 mr-2" />
              Recent Users
            </h2>
            <Link
              to="/admin/users"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              View All <FaArrowRight className="ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentUsers.length ? (
              recentUsers.map(user => (
                <div
                  key={user.id}
                  className="flex justify-between items-center py-4 px-6 hover:bg-gray-50"
                >
                  <div>
                    <h3 className="text-base font-medium text-gray-800">
                      {user.name || 'Unnamed'}
                    </h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.plan?.toLowerCase() === 'premium'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.plan || 'Free'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-6">No users found</p>
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="card-section bg-white rounded-xl shadow-sm border">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaFileAlt className="text-green-500 mr-2" />
              Recent Submissions (Active Users)
            </h2>
            <Link
              to="/progress"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              View All <FaArrowRight className="ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSubmissions.length ? (
              recentSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="flex justify-between items-center py-4 px-6 hover:bg-gray-50"
                >
                  <div>
                    <h3 className="truncate font-medium text-gray-800 max-w-xs">
                      {sub.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      by {sub.userName || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      Score: {typeof sub.score === 'number' ? sub.score.toFixed(2) : 'N/A'}%
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(sub.createdAt)} {/* Formatted createdAt */}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-6">No submissions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
