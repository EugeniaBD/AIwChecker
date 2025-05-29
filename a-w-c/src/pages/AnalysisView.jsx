import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import GaugeChart from 'react-gauge-chart'; // ✅ NEW
import '../styles/analysisView.css';
import { useLocation } from 'react-router-dom';


// Utility function to format Quality Score (Quality Score / 10)
function formatQualityScore(score) {
  const val = parseFloat(score);
  return (val / 10).toFixed(2);  // Ensures it shows 2 decimal places
}

// Utility function to format Readability Score (/100)
function formatReadability(score) {
  return parseFloat(score).toFixed(1);  // Ensures it shows 1 decimal place
}

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


const location = useLocation();
const [editModeFromProgress, setEditModeFromProgress] = useState(false);

useEffect(() => {
  if (location.state?.editMode) {
    setEditMode(true);
    setEditModeFromProgress(true); // ✅ track it came from Progress
  }
}, [location.state]);



  const fetchSubmission = useCallback(async () => {
    try {
      const submissionRef = doc(db, 'submissions', id);
      const submissionSnap = await getDoc(submissionRef);

      if (!submissionSnap.exists()) {
        setError('Submission not found');
        return;
      }

      const submissionData = submissionSnap.data();
      if (submissionData.userId !== currentUser.uid) {
        setError('You do not have permission to view this submission');
        return;
      }

      const formattedSubmission = {
        id: submissionSnap.id,
        ...submissionData,
        createdAt: submissionData.createdAt?.toDate() || new Date(),
        updatedAt: submissionData.updatedAt?.toDate() || null,
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
      await new Promise(resolve => setTimeout(resolve, 1500));

      const analysisResults = {
        aiInfluence: Math.floor(Math.random() * 70),
        score: 7 + Math.random() * 3,
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
        readabilityScore: 65 + Math.floor(Math.random() * 25),
        status: 'revised'
      };

      const submissionRef = doc(db, 'submissions', id);
      const updatedStatus = submission.status === 'draft' ? 'original' : 'revised';
        await updateDoc(doc(db, 'submissions', id), {
          title: title || 'Untitled Analysis',
          text,
          updatedAt: serverTimestamp(),
          aiInfluence: analysisResults.aiInfluence,
          score: analysisResults.score,
          readabilityScore: analysisResults.readabilityScore,
          suggestions: analysisResults.suggestions,
          strengths: analysisResults.strengths,
          status: updatedStatus  // 👈 promote draft to original
        });

      setSubmission({
        ...submission,
        ...analysisResults,
        title,
        text,
        updatedAt: new Date()
      });

      setEditMode(false);

    } catch (error) {
      setError('Failed to analyze text. Please try again.');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">
          <i className="fas fa-spinner fa-spin spinner-icon"></i>
          <p>Loading submission data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrapper">
        <div className="error-box">
          <p className="error-title">Error</p>
          <p>{error}</p>
        </div>
        <button onClick={() => navigate('/progress')} className="btn-primary">
          <i className="fas fa-arrow-left mr-2"></i> Back to Progress
        </button>
      </div>
    );
  }

  if (!submission) return null;

  if (editMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Edit Analysis</h1>
        <button
          onClick={() => {
            if (editModeFromProgress) {
              navigate('/progress'); // 👈 redirect if from Progress
            } else {
              setEditMode(false); // otherwise just exit edit mode
            }
          }}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
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
              className="btn-primary"
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
            onClick={() => {
              if (editModeFromProgress) {
                navigate('/progress');
              } else {
                setEditMode(false);
              }
            }}
            className="btn-secondary"
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
            {submission.updatedAt
              ? `Updated on ${submission.updatedAt.toLocaleDateString()} at ${submission.updatedAt.toLocaleTimeString()}`
              : `Analyzed on ${submission.createdAt.toLocaleDateString()} at ${submission.createdAt.toLocaleTimeString()}`}
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
                {submission.aiInfluence}%{' '}
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
            <p className="font-bold text-2xl text-blue-600">{formatQualityScore(submission.score)}/10</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-1">Readability</p>
            {/* ✅ Gauge chart added here */}
            <GaugeChart
              id="readability-meter"
              nrOfLevels={3}
              colors={['#E74C3C', '#F1C40F', '#2ECC71']}
              arcWidth={0.3}
              percent={Math.min(submission.readabilityScore / 100, 1)}
              formatTextValue={() => `${formatReadability(submission.readabilityScore)}/100`}
              textColor="#333"
            />
            <p className="text-sm text-gray-500 mt-2">
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
              {submission.suggestions.map((s, i) => (
                <li key={i} className="flex">
                  <span className="dot dot-yellow" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-3">
              <i className="fas fa-check-circle text-green-500 mr-2"></i> Writing Strengths
            </h3>
            <ul className="space-y-2">
              {submission.strengths.map((s, i) => (
                <li key={i} className="flex">
                  <span className="dot dot-green" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Text</h2>
        <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{submission.text}</div>
      </div>

      <div className="flex space-x-4">
        <button onClick={() => setEditMode(true)} className="btn-primary">
          <i className="fas fa-edit mr-2"></i> Edit & Resubmit
        </button>

        <button onClick={() => navigate('/analysis')} className="btn-green">
          <i className="fas fa-plus mr-2"></i> New Analysis
        </button>

        <button onClick={() => navigate('/progress')} className="btn-secondary">
          <i className="fas fa-chart-line mr-2"></i> View Progress
        </button>
      </div>
    </div>
  );
}

export default AnalysisView;
