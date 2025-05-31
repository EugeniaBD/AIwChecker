import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaFilter,
  FaTimesCircle,
  FaTrashAlt,
} from "react-icons/fa";

function Progress() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
   const [editMode, setEditMode] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("createdAt");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);

  // 🔁 Pagination
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

 
  useEffect(() => {
    async function fetchSubmissions() {
      console.log("Fetching submissions for user:", currentUser.uid); // Log current user UID

      try {
        const submissionsRef = collection(db, "submissions");
        const q = query(
          submissionsRef,
          where("userId", "==", currentUser.uid),
          orderBy(sortBy, sortOrder)
        );
        const snapshot = await getDocs(q);

        const items = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.createdAt?.toDate() || new Date(); // Ensure createdAt is a Date object
          const updatedAt = data.updatedAt?.toDate() || null; // Ensure updatedAt is a Date object or null

          // Debug: Log each submission's data and its updatedAt field
          console.log(`Fetched submission ${docSnap.id}: createdAt: ${createdAt}, updatedAt: ${updatedAt}`);

          if (startDate && createdAt < new Date(startDate)) return;
          if (endDate && createdAt > new Date(endDate)) return;

          items.push({
            id: docSnap.id,
            ...data,
            createdAt,
            updatedAt,
          });
        });

        console.log("Fetched submissions after processing:", items);  // Log all submissions after processing
        setSubmissions(items);
        setCurrentPage(1); // reset page when refetch
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Unable to load progress. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [currentUser, sortBy, sortOrder, startDate, endDate]);

  // Filter submissions
  const filteredSubmissions = () => {
    let filtered = submissions;
    console.log("Current filter applied:", filter);  // Log the current filter

    if (filter === "high-ai") {
      filtered = filtered.filter((sub) => sub.aiInfluence > 50);
    } else if (filter === "low-ai") {
      filtered = filtered.filter((sub) => sub.aiInfluence <= 20);
    } else if (filter === "high-score") {
      filtered = filtered.filter((sub) => sub.score >= 8);
    } else if (filter === "updated") {
      filtered = filtered.filter((sub) => sub.updatedAt !== null); // Show only submissions that have been updated
    }

    console.log("Filtered submissions:", filtered);  // Log the filtered submissions
    return filtered;
  };

  const paginatedSubmissions = () => {
    const filtered = filteredSubmissions();
    const start = (currentPage - 1) * pageSize;
    console.log(`Displaying page ${currentPage} with ${pageSize} items.`);  // Log the current page and page size
    return filtered.slice(start, start + pageSize);
  };

  const totalPages = Math.ceil(filteredSubmissions().length / pageSize);

  // Compute average score and AI influence for display
  const { avgScore, avgAiInfluence } = (() => {
    if (submissions.length === 0) return { avgScore: 0, avgAiInfluence: 0 };
    const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
    const totalAI = submissions.reduce((sum, s) => sum + (s.aiInfluence || 0), 0);
    return {
      avgScore: totalScore / submissions.length,
      avgAiInfluence: totalAI / submissions.length,
    };
  })();

const handleView = (id, status) => {
  console.log("Navigating to submission with ID:", id);
  if (status === 'draft') {
    navigate(`/analysis/${id}`, { state: { editMode: true } }); // 👈 pass state
  } else {
    navigate(`/analysis/${id}`);
  }
};


  // Toggle filter panel visibility
  const toggleFilterPanel = () => setShowFilters(!showFilters);
  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  // Handle sorting logic
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Toggle selection of submissions for deletion
  const toggleSelect = (id) => {
    setSelectedSubmissions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Delete selected submissions
  const handleDeleteSelected = async () => {
    const toDelete =
      selectedSubmissions.length === filteredSubmissions().length
        ? filteredSubmissions().map((s) => s.id)
        : selectedSubmissions;

    if (toDelete.length === 0) return;

    const confirm = window.confirm(
      `Are you sure you want to delete ${
        toDelete.length === filteredSubmissions().length ? "all filtered" : "the selected"
      } submission${toDelete.length > 1 ? "s" : ""}?`
    );
    if (!confirm) return;

    try {
      await Promise.all(toDelete.map((id) => deleteDoc(doc(db, "submissions", id))));
      setSubmissions((prev) => prev.filter((s) => !toDelete.includes(s.id)));
      setSelectedSubmissions([]);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete one or more submissions.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Writing Progress</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <i className="fas fa-exclamation-circle mr-2"></i> {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Submission History</h2>
        <button
          onClick={toggleFilterPanel}
          className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200"
        >
          <FaFilter className="mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="startDate">
                <FaCalendarAlt className="inline-block mr-1" />
                Start Date:
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="endDate">
                <FaCalendarAlt className="inline-block mr-1" />
                End Date:
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1"
              />
            </div>
            {(startDate || endDate) && (
              <div className="flex items-end">
                <button
                  onClick={clearDateFilters}
                  className="p-2 text-red-600 hover:text-red-800"
                  title="Clear Date Filters"
                >
                  <FaTimesCircle size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label htmlFor="filter" className="mr-2 text-sm text-gray-600">Filter by:</label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // reset page
              }}
              className="border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="all">All Submissions</option>
              <option value="high-ai">High AI Influence</option>
              <option value="low-ai">Low AI Influence</option>
              <option value="high-score">High Quality (8+)</option>
              <option value="updated">Revised Submissions</option>
            </select>
          </div>

          {selectedSubmissions.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition"
              title={selectedSubmissions.length === filteredSubmissions().length
                ? "Delete all"
                : "Delete selected"
              }
            >
              <FaTrashAlt size={18} />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedSubmissions().length > 0 && paginatedSubmissions().every((s) => selectedSubmissions.includes(s.id))}
                    onChange={(e) => {
                      const pageIds = paginatedSubmissions().map((s) => s.id);
                      if (e.target.checked) {
                        setSelectedSubmissions((prev) => [...new Set([...prev, ...pageIds])]);
                      } else {
                        setSelectedSubmissions((prev) => prev.filter((id) => !pageIds.includes(id)));
                      }
                    }}
                  />
                </th>
                {["title", "createdAt", "score", "aiInfluence"].map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    {col === "createdAt" ? "Date" : col.charAt(0).toUpperCase() + col.slice(1)}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSubmissions().map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.title || "Untitled"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.createdAt.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{s.score?.toFixed(1) || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${ s.aiInfluence > 50 ? "bg-red-100 text-red-800" : s.aiInfluence > 20 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                      {s.aiInfluence ? `${s.aiInfluence}%` : "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        typeof s.aiInfluence !== 'number'
                          ? 'bg-purple-100 text-purple-800'
                          : s.updatedAt
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {typeof s.aiInfluence !== 'number'
                        ? 'Draft'
                        : s.updatedAt
                        ? 'Revised'
                        : 'Original'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleView(s.id, s.status)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      <i className="fas fa-eye mr-1"></i> View/Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredSubmissions().length > pageSize && (
          <div className="flex justify-between items-center mt-6">
            <div>
              <label className="text-sm text-gray-600 mr-2">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1"
              >
                {[5, 10, 15, 20].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-sm px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-sm px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Progress;
