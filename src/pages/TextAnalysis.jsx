// File: src/pages/TextAnalysis.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';

function TextAnalysis() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const minTextLength = 100;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (text.length < minTextLength) {
      setError(`Text must be at least ${minTextLength} characters long`);
      return;
    }

    try {
      setError('');
      setAnalyzing(true);

      // Simulating text analysis with random results for this demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Example analysis results
      const analysisResults = {
        aiInfluence: Math.floor(Math.random() * 70),  // 0-70%
        score: 7 + Math.random() * 3,  // 7-10
        suggestions: [
          { text: 'Try varying your sentence structures more', color: 'bg-yellow-500' },
          { text: 'Consider adding more personal perspectives', color: 'bg-green-500' },
          { text: 'Use more specific examples to illustrate your points', color: 'bg-blue-500' },
          { text: 'Add some transitional phrases between paragraphs', color: 'bg-red-500' }
        ],
        strengths: [
          { text: 'Good vocabulary usage', color: 'bg-green-500' },
          { text: 'Clear organization of ideas', color: 'bg-blue-500' },
          { text: 'Effective use of examples', color: 'bg-yellow-500' }
        ],
        readability: {
          score: 65 + Math.floor(Math.random() * 25),  // 65-90
          level: 'Intermediate'
        }
      };

      // Save to Firestore
      const submissionRef = await addDoc(collection(db, 'submissions'), {
        userId: currentUser.uid,
        title: title || 'Untitled Analysis',
        text,
        createdAt: serverTimestamp(),
        aiInfluence: analysisResults.aiInfluence,
        score: analysisResults.score,
        readabilityScore: analysisResults.readability.score,
        suggestions: analysisResults.suggestions,
        strengths: analysisResults.strengths
      });

      setResults({
        id: submissionRef.id,
        ...analysisResults
      });

    } catch (error) {
      setError('Failed to analyze text. Please try again.');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setTitle('');
    setText('');
    setResults(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Text Analysis</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <i className="fas fa-exclamation-circle mr-2"></i> {error}
        </div>
      )}

      {!results ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
                Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your analysis a title"
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
                placeholder="Paste or write your text here..."
                required
              ></textarea>
              <p className="mt-2 text-sm text-gray-500">
                {text.length} / {minTextLength} characters minimum
              </p>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={analyzing || text.length < minTextLength}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {analyzing ? (
                  <span className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i> Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <i className="fas fa-search mr-2"></i> Analyze Text
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setText('')}
                className="px-4 py-2 text-gray-700 hover:text-red-600"
              >
                <i className="fas fa-trash-alt mr-2"></i> Clear
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Analysis Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">AI Influence</p>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${results.aiInfluence}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        results.aiInfluence > 50
                          ? 'bg-red-500'
                          : results.aiInfluence > 20
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    ></div>
                  </div>
                  <p className="font-bold text-lg">
                    {results.aiInfluence}%
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {results.aiInfluence > 50
                        ? 'High AI influence'
                        : results.aiInfluence > 20
                        ? 'Moderate AI influence'
                        : 'Low AI influence'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Quality Score</p>
                <p className="font-bold text-2xl text-blue-600">{results.score.toFixed(1)}/10</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Readability</p>
                <p className="font-bold text-2xl text-green-600">{results.readability.score}/100</p>
                <p className="text-sm text-gray-500">{results.readability.level} level</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-3">
                  <i className="fas fa-exclamation-circle text-yellow-500 mr-2"></i> Improvement Suggestions
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${results.suggestions[0].color}`}></div>
                    <span>{results.suggestions[0].text}</span>
                  </li>
                  <li className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${results.suggestions[1].color}`}></div>
                    <span>{results.suggestions[1].text}</span>
                  </li>
                  <li className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${results.suggestions[2].color}`}></div>
                    <span>{results.suggestions[2].text}</span>
                  </li>
                  <li className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${results.suggestions[3].color}`}></div>
                    <span>{results.suggestions[3].text}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-3">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i> Writing Strengths
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${results.strengths[0].color}`}></div>
                    <span>{results.strengths[0].text}</span>
                  </li>
                  <li className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${results.strengths[1].color}`}></div>
                    <span>{results.strengths[1].text}</span>
                  </li>
                  <li className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${results.strengths[2].color}`}></div>
                    <span>{results.strengths[2].text}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleNewAnalysis}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      )}
    </div>
  );
}

export default TextAnalysis;
