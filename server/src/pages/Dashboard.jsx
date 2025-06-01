// File: src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';

function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    avgScore: 0,
    improvementRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Get user's name from userProfile or fallback to displayName from Firebase Auth
  const userName = userProfile?.name || currentUser?.displayName || currentUser?.email;

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch recent submissions
        const submissionsRef = collection(db, 'submissions');
        const q = query(
          submissionsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const submissions = [];
        querySnapshot.forEach((doc) => {
          submissions.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setRecentSubmissions(submissions);
        
        // Calculate stats
        if (submissions.length > 0) {
          const totalSubmissions = submissions.length;
          const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
          const avgScore = totalScore / totalSubmissions;
          
          // A simple improvement rate calculation
          let improvementRate = 0;
          if (submissions.length >= 2) {
            const firstScore = submissions[submissions.length - 1].score || 0;
            const lastScore = submissions[0].score || 0;
            improvementRate = ((lastScore - firstScore) / firstScore) * 100;
            improvementRate = Math.max(0, improvementRate); // Ensure it's positive
          }
          
          setStats({
            totalSubmissions,
            avgScore,
            improvementRate
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-blue-600 text-4xl mb-4"></i>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {userName}!</h1>
        <p className="text-gray-600">Track your writing progress and improve your content with AI detection analysis.</p>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/analysis" className="bg-blue-600 text-white rounded-lg p-4 flex items-center justify-center hover:bg-blue-700 transition">
            <i className="fas fa-file-alt text-2xl mr-3"></i>
            <span className="font-medium">New Analysis</span>
          </Link>
          <Link to="/progress" className="bg-green-600 text-white rounded-lg p-4 flex items-center justify-center hover:bg-green-700 transition">
            <i className="fas fa-chart-line text-2xl mr-3"></i>
            <span className="font-medium">View Progress</span>
          </Link>
          <Link to="/help" className="bg-purple-600 text-white rounded-lg p-4 flex items-center justify-center hover:bg-purple-700 transition">
            <i className="fas fa-question-circle text-2xl mr-3"></i>
            <span className="font-medium">Get Help</span>
          </Link>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Submissions</h3>
            <span className="text-blue-600 bg-blue-100 p-2 rounded-full">
              <i className="fas fa-file-alt"></i>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalSubmissions}</p>
          <p className="text-sm text-gray-500 mt-2">Text analyses submitted</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Average Score</h3>
            <span className="text-green-600 bg-green-100 p-2 rounded-full">
              <i className="fas fa-star"></i>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.avgScore.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-2">Average quality score</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Improvement</h3>
            <span className="text-purple-600 bg-purple-100 p-2 rounded-full">
              <i className="fas fa-arrow-up"></i>
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.improvementRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-2">Improvement rate</p>
        </div>
      </div>
      
      {/* Recent Submissions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Submissions</h2>
        
        {recentSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-file-alt text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">No submissions yet. Get started by analyzing your first text!</p>
            <Link to="/analysis" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Start Analysis
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Influence
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.title || 'Untitled'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {submission.score ? submission.score.toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        submission.aiInfluence > 50 
                          ? 'bg-red-100 text-red-800' 
                          : submission.aiInfluence > 20 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {submission.aiInfluence ? `${submission.aiInfluence}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/analysis/${submission.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                        <i className="fas fa-eye"></i> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {recentSubmissions.length > 0 && (
          <div className="mt-4 text-center">
            <Link to="/progress" className="text-blue-600 hover:text-blue-800">
              View all submissions <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </div>
        )}
      </div>
      
      {/* Tips */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Writing Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">
              <i className="fas fa-lightbulb mr-2"></i> Improve Originality
            </h3>
            <p className="text-sm text-blue-700">
              Try to use your own voice and perspective. Avoid generic phrases and add personal insights to make your writing stand out.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">
              <i className="fas fa-pen-fancy mr-2"></i> Enhance Coherence
            </h3>
            <p className="text-sm text-green-700">
              Connect your ideas logically and use transitional phrases to guide readers through your content smoothly.
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800 mb-2">
              <i className="fas fa-magic mr-2"></i> Reduce AI Patterns
            </h3>
            <p className="text-sm text-purple-700">
              Vary your sentence structures and avoid repetitive patterns that are common in AI-generated content.
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">
              <i className="fas fa-sync mr-2"></i> Regular Practice
            </h3>
            <p className="text-sm text-yellow-700">
              The more you write and analyze your content, the better you'll get at creating authentic, high-quality writing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;