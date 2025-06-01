import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';

function AnalysisView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [submission, setSubmission] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  
  const fetchSubmission = useCallback(async () => {
    try {
      const submissionRef = doc(db, 'submissions', id);
      const submissionSnap = await getDoc(submissionRef);
      
      if (!submissionSnap.exists()) {
        setError('Submission not found');
        return;
      }
      
      const submissionData = submissionSnap.data();
      
      // Check if this submission belongs to the current user
      if (submissionData.userId !== currentUser.uid) {
        setError('You do not have permission to view this submission');
        return;
      }
      
      const formattedSubmission = {
        id: submissionSnap.id,
        ...submissionData,
        createdAt: submissionData.createdAt?.toDate() || new Date()
      };
      
      setSubmission(formattedSubmission);
      setTitle(formattedSubmission.title || 'Untitled Analysis');
      setText(formattedSubmission.text || '');
    } catch (error) {
      console.error("Error fetching submission:", error);
      setError('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);
  
  const handleReanalyze = async () => {
    if (text.trim().length < 100) {
      setError('Text must be at least 100 characters long');
      return;
    }
    
    try {
      setAnalyzing(true);
      setError('');
      
      // Simulate an analysis process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Example analysis results
      const analysisResults = {
        aiInfluence: Math.floor(Math.random() * 70),  // 0-70%
        score: 7 + Math.random() * 3,  // 7-10
        suggestions: [
          'Try varying your sentence structures more',
          'Consider adding more personal perspectives',
          'Use more specific examples to illustrate your points',
          'Add some transitional phrases between paragraphs'
        ],
        strengths: [
          'Good vocabulary usage',
          'Clear organization of ideas',
          'Effective use of examples'
        ],
        readabilityScore: 65 + Math.floor(Math.random() * 25)  // 65-90
      };
      
      // Update in Firestore
      const submissionRef = doc(db, 'submissions', id);
      await updateDoc(submissionRef, {
        title: title || 'Untitled Analysis',
        text,
        updatedAt: serverTimestamp(),
        aiInfluence: analysisResults.aiInfluence,
        score: analysisResults.score,
        readabilityScore: analysisResults.readabilityScore,
        suggestions: analysisResults.suggestions,
        strengths: analysisResults.strengths
      });
      
      // Update local state
      setSubmission({
        ...submission,
        ...analysisResults,
        title,
        text,
        updatedAt: new Date()
      });
      
      // Exit edit mode
      setEditMode(false);
      
    } catch (error) {
      setError('Failed to analyze text. Please try again.');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-blue-600 text-4xl mb-4"></i>
          <p className="text-gray-600">Loading submission data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/progress')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <i className="fas fa-arrow-left mr-2"></i> Back to Progress
        </button>
      </div>
    );
  }
  
  if (!submission) {
    return null;
  }

  if (editMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Edit Analysis</h1>
          <button
            onClick={() => setEditMode(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <i className="fas fa-times mr-2"></i> Cancel Editing
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title of your analysis"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="text">
              Your Text <span className="text-red-500">*</span>
            </label>
            <textarea
              id="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="12"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Edit your text here..."
              required
            ></textarea>
            <p className="mt-2 text-sm text-gray-500">
              {text.length} / 100 characters minimum
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleReanalyze}
              disabled={analyzing || text.length < 100}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {analyzing ? (
                <span className="flex items-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i> Analyzing...
                </span>
              ) : (
                <span className="flex items-center">
                  <i className="fas fa-sync mr-2"></i> Re-analyze Text
                </span>
              )}
            </button>
            
            <button
              onClick={() => setEditMode(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{submission.title || 'Untitled Analysis'}</h1>
        <button
          onClick={() => navigate('/progress')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          <i className="fas fa-arrow-left mr-2"></i> Back to Progress
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Analysis Results</h2>
          <p className="text-sm text-gray-500">
            {submission.updatedAt ? (
              <>
                Updated on {submission.updatedAt.toLocaleDateString()} at {submission.updatedAt.toLocaleTimeString()}
              </>
            ) : (
              <>
                Analyzed on {submission.createdAt.toLocaleDateString()} at {submission.createdAt.toLocaleTimeString()}
              </>
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">AI Influence</p>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${submission.aiInfluence}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    submission.aiInfluence > 50
                      ? 'bg-red-500'
                      : submission.aiInfluence > 20
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                ></div>
              </div>
              <p className="font-bold text-lg">
                {submission.aiInfluence}% 
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {submission.aiInfluence > 50
                    ? 'High AI influence'
                    : submission.aiInfluence > 20
                    ? 'Moderate AI influence'
                    : 'Low AI influence'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Quality Score</p>
            <p className="font-bold text-2xl text-blue-600">{submission.score.toFixed(1)}/10</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Readability</p>
            <p className="font-bold text-2xl text-green-600">{submission.readabilityScore}/100</p>
            <p className="text-sm text-gray-500">
              {submission.readabilityScore > 80
                ? 'Advanced'
                : submission.readabilityScore > 60
                ? 'Intermediate'
                : 'Basic'}{' '}
              level
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">
              <i className="fas fa-exclamation-circle text-yellow-500 mr-2"></i> Improvement Suggestions
            </h3>
            <ul className="space-y-2">
              {submission.suggestions?.map((suggestion, index) => (
                <li key={index} className="flex">
                  <i className="fas fa-angle-right text-yellow-500 mt-1 mr-2"></i>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-3">
              <i className="fas fa-check-circle text-green-500 mr-2"></i> Writing Strengths
            </h3>
            <ul className="space-y-2">
              {submission.strengths?.map((strength, index) => (
                <li key={index} className="flex">
                  <i className="fas fa-check text-green-500 mt-1 mr-2"></i>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Text</h2>
        <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
          {submission.text}
        </div>
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={() => setEditMode(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <i className="fas fa-edit mr-2"></i> Edit & Resubmit
        </button>
        
        <button
          onClick={() => navigate('/analysis')}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <i className="fas fa-plus mr-2"></i> New Analysis
        </button>
        
        <button
          onClick={() => navigate('/progress')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <i className="fas fa-chart-line mr-2"></i> View Progress
        </button>
      </div>
    </div>
  );
}

export default AnalysisView;
