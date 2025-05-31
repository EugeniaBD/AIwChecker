import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../contexts/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    averageScore: 0,
    completedAnalyses: 0,
    pendingAnalyses: 0,
  });
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    admins: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("week"); // 'week', 'month', 'year'
  const [reportType, setReportType] = useState("all"); // 'all', 'completed', 'pending'
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState("analyses"); // 'analyses', 'users'
  const [userAnalysisData, setUserAnalysisData] = useState([]);
  const [analysisTypeData, setAnalysisTypeData] = useState([]);

  useEffect(() => {
    fetchReportData();
    fetchUserData();
    fetchAllUserAnalysisData();
  }, [dateRange, reportType]);

  async function fetchAllUserAnalysisData() {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      if (dateRange === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (dateRange === "year") {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // 1. Get all users
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Fetch analyses data
      const analysesRef = collection(db, "analyses");
      let analysesQuery = query(
        analysesRef,
        where("createdAt", ">=", startDate.toISOString()),
        where("createdAt", "<=", endDate.toISOString())
      );

      // Apply status filter if needed
      if (reportType === "completed") {
        analysesQuery = query(
          analysesQuery,
          where("status", "==", "completed")
        );
      } else if (reportType === "pending") {
        analysesQuery = query(analysesQuery, where("status", "==", "pending"));
      }

      const analysesSnapshot = await getDocs(analysesQuery);
      const analysesData = analysesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 3. Group analyses by user
      const userAnalysisMap = {};

      // Initialize map with all users
      usersData.forEach((user) => {
        userAnalysisMap[user.id] = {
          userId: user.id,
          userName: user.name || "Unknown",
          email: user.email || "No Email",
          totalAnalyses: 0,
          completedAnalyses: 0,
          pendingAnalyses: 0,
          averageScore: 0,
          totalScore: 0,
          scoreCount: 0,
          analysisByDate: {},
          analysisByType: {},
        };
      });

      // Populate with analysis data
      analysesData.forEach((analysis) => {
        const userId = analysis.userId;
        if (!userId) return;

        // Initialize user data if not exists (in case analysis has user not found in users collection)
        if (!userAnalysisMap[userId]) {
          userAnalysisMap[userId] = {
            userId,
            userName: analysis.userName || "Unknown",
            email: "Unknown",
            totalAnalyses: 0,
            completedAnalyses: 0,
            pendingAnalyses: 0,
            averageScore: 0,
            totalScore: 0,
            scoreCount: 0,
            analysisByDate: {},
            analysisByType: {},
          };
        }

        // Update counts
        userAnalysisMap[userId].totalAnalyses++;

        if (analysis.status === "completed") {
          userAnalysisMap[userId].completedAnalyses++;
        } else if (analysis.status === "pending") {
          userAnalysisMap[userId].pendingAnalyses++;
        }

        // Update score data
        if (analysis.score !== undefined) {
          userAnalysisMap[userId].totalScore += analysis.score;
          userAnalysisMap[userId].scoreCount++;
          userAnalysisMap[userId].averageScore = Math.round(
            userAnalysisMap[userId].totalScore /
              userAnalysisMap[userId].scoreCount
          );
        }

        // Track analysis by date
        const dateStr = new Date(analysis.createdAt)
          .toISOString()
          .split("T")[0];
        if (!userAnalysisMap[userId].analysisByDate[dateStr]) {
          userAnalysisMap[userId].analysisByDate[dateStr] = 0;
        }
        userAnalysisMap[userId].analysisByDate[dateStr]++;

        // Track analysis by type
        const analysisType = analysis.type || "Unknown";
        if (!userAnalysisMap[userId].analysisByType[analysisType]) {
          userAnalysisMap[userId].analysisByType[analysisType] = 0;
        }
        userAnalysisMap[userId].analysisByType[analysisType]++;
      });

      // Convert to array and sort by total analyses
      const userAnalysisArray = Object.values(userAnalysisMap)
        .filter((item) => item.totalAnalyses > 0)
        .sort((a, b) => b.totalAnalyses - a.totalAnalyses);

      setUserAnalysisData(userAnalysisArray);

      // Prepare analysis type distribution data
      const typeDistribution = {};
      userAnalysisArray.forEach((userData) => {
        Object.entries(userData.analysisByType).forEach(([type, count]) => {
          if (!typeDistribution[type]) {
            typeDistribution[type] = 0;
          }
          typeDistribution[type] += count;
        });
      });

      const analysisTypeDataArray = Object.entries(typeDistribution).map(
        ([name, value]) => ({
          name,
          value,
        })
      );

      setAnalysisTypeData(analysisTypeDataArray);
    } catch (err) {
      console.error("Error fetching user analysis data:", err);
      setError("Failed to load user analysis data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchReportData() {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      if (dateRange === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (dateRange === "year") {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Fetch analyses within date range
      const analysesRef = collection(db, "analyses");
      let analysesQuery = query(
        analysesRef,
        where("createdAt", ">=", startDate.toISOString()),
        where("createdAt", "<=", endDate.toISOString())
      );

      // Apply report type filter
      if (reportType === "completed") {
        analysesQuery = query(
          analysesQuery,
          where("status", "==", "completed")
        );
      } else if (reportType === "pending") {
        analysesQuery = query(analysesQuery, where("status", "==", "pending"));
      }

      const analysesSnapshot = await getDocs(analysesQuery);
      const analysesData = analysesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReports(analysesData);

      // Calculate statistics
      const totalAnalyses = analysesData.length;
      const completedAnalyses = analysesData.filter(
        (a) => a.status === "completed"
      ).length;
      const pendingAnalyses = analysesData.filter(
        (a) => a.status === "pending"
      ).length;
      const scores = analysesData
        .filter((a) => a.score !== undefined)
        .map((a) => a.score);
      const averageScore =
        scores.length > 0
          ? Math.round(
              scores.reduce((sum, score) => sum + score, 0) / scores.length
            )
          : 0;

      setStats({
        totalAnalyses,
        averageScore,
        completedAnalyses,
        pendingAnalyses,
      });

      // Prepare chart data - analyses per day
      const chartData = generateChartData(analysesData, startDate, endDate);
      setChartData(chartData);

      // Get recent analyses
      const recentAnalysesQuery = query(
        analysesRef,
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const recentAnalysesSnapshot = await getDocs(recentAnalysesQuery);
      const recentAnalysesData = recentAnalysesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecentAnalyses(recentAnalysesData);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserData() {
    try {
      // Calculate date range for new users calculation
      const endDate = new Date();
      const startDate = new Date();

      if (dateRange === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (dateRange === "year") {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Fetch all users
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(usersData);

      // Calculate user statistics
      const totalUsers = usersData.length;
      const admins = usersData.filter((u) => u.role === "admin").length;

      // Consider users with activity in the last 30 days as active
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      // Use lastLogin if available, otherwise use createdAt
      const activeUsers = usersData.filter((u) => {
        const lastActivity = u.lastLogin || u.updatedAt || u.createdAt;
        return lastActivity && lastActivity >= thirtyDaysAgoStr;
      }).length;

      // New users in the selected date range
      const newUsers = usersData.filter((u) => {
        return (
          u.createdAt &&
          u.createdAt >= startDate.toISOString() &&
          u.createdAt <= endDate.toISOString()
        );
      }).length;

      setUserStats({
        totalUsers,
        activeUsers,
        newUsers,
        admins,
      });

      // Get recent users
      const sortedUsers = [...usersData].sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      setRecentUsers(sortedUsers.slice(0, 10));
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data. Please try again later.");
    }
  }

  function generateChartData(analyses, startDate, endDate) {
    // Create an object to hold counts by date
    const countsByDate = {};

    // Initialize all dates in range with zero counts
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split("T")[0];
      countsByDate[dateString] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count analyses by date
    analyses.forEach((analysis) => {
      const dateString = new Date(analysis.createdAt)
        .toISOString()
        .split("T")[0];
      if (countsByDate[dateString] !== undefined) {
        countsByDate[dateString]++;
      }
    });

    // Convert to array format for charts
    return Object.keys(countsByDate).map((date) => ({
      date,
      count: countsByDate[date],
    }));
  }

  function exportReports() {
    try {
      // Determine what data to export based on active tab
      let csvContent;

      if (activeTab === "analyses") {
        // Convert reports data to CSV
        const headers = [
          "ID",
          "Title",
          "User",
          "Score",
          "Status",
          "Created At",
        ];
        csvContent = [
          headers.join(","),
          ...reports.map((report) =>
            [
              report.id,
              (report.title || "Untitled").replace(/,/g, " "),
              (report.userName || "Unknown").replace(/,/g, " "),
              report.score || "N/A",
              report.status || "Unknown",
              new Date(report.createdAt).toLocaleString().replace(/,/g, " "),
            ].join(",")
          ),
        ].join("\n");
      } else if (activeTab === "users") {
        // Convert user data to CSV
        const headers = [
          "ID",
          "Name",
          "Email",
          "Role",
          "Created At",
          "Last Activity",
        ];
        csvContent = [
          headers.join(","),
          ...users.map((user) =>
            [
              user.id,
              (user.name || "Unknown").replace(/,/g, " "),
              (user.email || "No Email").replace(/,/g, " "),
              user.role || "user",
              new Date(user.createdAt || 0).toLocaleString().replace(/,/g, " "),
              new Date(user.lastLogin || user.updatedAt || user.createdAt || 0)
                .toLocaleString()
                .replace(/,/g, " "),
            ].join(",")
          ),
        ].join("\n");
      } else {
        // Export user analysis data
        const headers = [
          "User ID",
          "Name",
          "Email",
          "Total Analyses",
          "Completed",
          "Pending",
          "Average Score",
        ];
        csvContent = [
          headers.join(","),
          ...userAnalysisData.map((userData) =>
            [
              userData.userId,
              (userData.userName || "Unknown").replace(/,/g, " "),
              (userData.email || "No Email").replace(/,/g, " "),
              userData.totalAnalyses,
              userData.completedAnalyses,
              userData.pendingAnalyses,
              userData.averageScore || "N/A",
            ].join(",")
          ),
        ].join("\n");
      }

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const fileName =
        activeTab === "analyses"
          ? `analysis-reports-${new Date().toISOString().split("T")[0]}.csv`
          : activeTab === "users"
          ? `user-reports-${new Date().toISOString().split("T")[0]}.csv`
          : `user-analysis-reports-${
              new Date().toISOString().split("T")[0]
            }.csv`;
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting reports:", err);
      setError("Failed to export reports. Please try again.");
    }
  }

  // Colors for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Analytics & Reports
        </h1>
        <button
          onClick={exportReports}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <i className="fas fa-download mr-2"></i> Export to CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-3 px-6 ${
            activeTab === "analyses"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("analyses")}
        >
          Analysis Reports
        </button>
        <button
          className={`py-3 px-6 ${
            activeTab === "users"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("users")}
        >
          User Reports
        </button>
        <button
          className={`py-3 px-6 ${
            activeTab === "userAnalyses"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("userAnalyses")}
        >
          User Analysis Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div>
              <label
                htmlFor="dateRange"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date Range
              </label>
              <select
                id="dateRange"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last 12 Months</option>
              </select>
            </div>

            {activeTab === "analyses" && (
              <div>
                <label
                  htmlFor="reportType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Report Type
                </label>
                <select
                  id="reportType"
                  className="px-3 py-2 border border-gray-300 rounded-md w-full"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="all">All Analyses</option>
                  <option value="completed">Completed Analyses</option>
                  <option value="pending">Pending Analyses</option>
                </select>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              fetchReportData();
              fetchUserData();
              fetchAllUserAnalysisData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* User Analysis Data Tab */}
      {activeTab === "userAnalyses" && (
        <>
          {/* User Analysis Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <i className="fas fa-users text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Users with Analyses</h3>
                  <p className="text-2xl font-semibold">
                    {userAnalysisData.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <i className="fas fa-chart-pie text-purple-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">
                    Avg. Analyses per User
                  </h3>
                  <p className="text-2xl font-semibold">
                    {userAnalysisData.length > 0
                      ? Math.round(
                          userAnalysisData.reduce(
                            (sum, user) => sum + user.totalAnalyses,
                            0
                          ) / userAnalysisData.length
                        )
                      : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <i className="fas fa-check-circle text-green-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Completed</h3>
                  <p className="text-2xl font-semibold">
                    {userAnalysisData.reduce(
                      (sum, user) => sum + user.completedAnalyses,
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <i className="fas fa-clock text-yellow-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Pending</h3>
                  <p className="text-2xl font-semibold">
                    {userAnalysisData.reduce(
                      (sum, user) => sum + user.pendingAnalyses,
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Analysis Type Distribution
                </h2>
              </div>
              <div className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysisTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analysisTypeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Analyses"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Users by Analysis Count */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Top Users by Analysis Count
                </h2>
              </div>
              <div className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userAnalysisData.slice(0, 5)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="userName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        name="Total Analyses"
                        dataKey="totalAnalyses"
                        fill="#8884d8"
                      />
                      <Bar
                        name="Completed"
                        dataKey="completedAnalyses"
                        fill="#82ca9d"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* User Analysis Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                User Analysis Data
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total Analyses
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Completed
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Pending
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Avg. Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userAnalysisData.length > 0 ? (
                    userAnalysisData.map((userData) => (
                      <tr key={userData.userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {userData.userName?.charAt(0) || "U"}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {userData.userName || "Unknown"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {userData.email || "No Email"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {userData.totalAnalyses}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {userData.completedAnalyses}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {userData.pendingAnalyses}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {userData.averageScore || "N/A"}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No user analysis data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Analysis Reports Tab */}
      {activeTab === "analyses" && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <i className="fas fa-file-alt text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Analyses</h3>
                  <p className="text-2xl font-semibold">
                    {stats.totalAnalyses}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <i className="fas fa-check-circle text-green-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Completed</h3>
                  <p className="text-2xl font-semibold">
                    {stats.completedAnalyses}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <i className="fas fa-clock text-yellow-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Pending</h3>
                  <p className="text-2xl font-semibold">
                    {stats.pendingAnalyses}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <i className="fas fa-star text-purple-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Average Score</h3>
                  <p className="text-2xl font-semibold">{stats.averageScore}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Analysis Trends
              </h2>
            </div>
            <div className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Analyses"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Analyses Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Analyses
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Score
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentAnalyses.map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {analysis.title || "Untitled Analysis"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {analysis.userName || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            analysis.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {analysis.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {analysis.score !== undefined
                            ? analysis.score
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* User Reports Tab */}
      {activeTab === "users" && (
        <>
          {/* User Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <i className="fas fa-users text-blue-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Total Users</h3>
                  <p className="text-2xl font-semibold">
                    {userStats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <i className="fas fa-user-check text-green-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Active Users</h3>
                  <p className="text-2xl font-semibold">
                    {userStats.activeUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <i className="fas fa-user-plus text-purple-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">New Users</h3>
                  <p className="text-2xl font-semibold">{userStats.newUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <i className="fas fa-user-shield text-yellow-600 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm">Admins</h3>
                  <p className="text-2xl font-semibold">{userStats.admins}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Users
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || "Unnamed User"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email || "No Email"}
                        </div>
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
                        <div className="text-sm text-gray-900">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.lastLogin || user.updatedAt
                            ? new Date(
                                user.lastLogin || user.updatedAt
                              ).toLocaleDateString()
                            : "Unknown"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReports;
