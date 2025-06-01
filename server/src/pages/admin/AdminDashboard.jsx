// File: src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../contexts/AuthContext';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAnalyses: 0,
    premiumUsers: 0
  });
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        setLoading(true);
        
        // Fetch user statistics
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;
        
        // Count premium users
        const premiumQuery = query(usersRef, where('subscription', '==', 'premium'));
        const premiumSnapshot = await getDocs(premiumQuery);
        const premiumUsers = premiumSnapshot.size;
        
        // Count active users (users who logged in within the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeQuery = query(usersRef, where('lastLogin', '>=', sevenDaysAgo.toISOString()));
        const activeSnapshot = await getDocs(activeQuery);
        const activeUsers = activeSnapshot.size;
        
        // Fetch total analyses
        const analysesRef = collection(db, 'analyses');
        const analysesSnapshot = await getDocs(analysesRef);
        const totalAnalyses = analysesSnapshot.size;
        
        setStats({
          totalUsers,
          activeUsers,
          totalAnalyses,
          premiumUsers
        });
        
        // Fetch recent users
        const recentUsersQuery = query(
          usersRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsersData = recentUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentUsers(recentUsersData);
        
        // Fetch recent analyses
        const recentAnalysesQuery = query(
          analysesRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentAnalysesSnapshot = await getDocs(recentAnalysesQuery);
        const recentAnalysesData = recentAnalysesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentAnalyses(recentAnalysesData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    }
    
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Link
            to="/admin/reports"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <i className="fas fa-chart-bar mr-2"></i> View Reports
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <i className="fas fa-users mr-2"></i> Manage Users
          </Link>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <i className="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Total Users</h3>
              <p className="text-2xl font-semibold">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <i className="fas fa-user-check text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Active Users (7d)</h3>
              <p className="text-2xl font-semibold">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <i className="fas fa-crown text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Premium Users</h3>
              <p className="text-2xl font-semibold">{stats.premiumUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <i className="fas fa-file-alt text-yellow-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm">Total Analyses</h3>
              <p className="text-2xl font-semibold">{stats.totalAnalyses}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Recent Users</h2>
            <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentUsers.length > 0 ? (
              recentUsers.map(user => (
                <div key={user.id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.subscription === 'premium' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription === 'premium' ? 'Premium' : 'Free'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Analyses */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Recent Analyses</h2>
            <Link to="/admin/reports" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentAnalyses.length > 0 ? (
              recentAnalyses.map(analysis => (
                <div key={analysis.id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800 truncate max-w-xs">
                        {analysis.title || 'Untitled Analysis'}
                      </h3>
                      <p className="text-sm text-gray-600">by {analysis.userName || 'Unknown User'}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Score: {analysis.score}%
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No analyses found
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <i className="fas fa-user-plus text-3xl text-blue-600 mb-2"></i>
            <span className="text-gray-800">Add New User</span>
          </Link>
          
          <Link
            to="/admin/settings"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <i className="fas fa-cog text-3xl text-gray-600 mb-2"></i>
            <span className="text-gray-800">System Settings</span>
          </Link>
          
          <Link
            to="/admin/reports"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <i className="fas fa-download text-3xl text-green-600 mb-2"></i>
            <span className="text-gray-800">Export Reports</span>
          </Link>
          
         
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
