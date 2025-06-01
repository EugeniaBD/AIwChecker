import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../contexts/AuthContext';
import GaugeChart from 'react-gauge-chart';
import '../styles/TextAnalysis.css';

function TextAnalysis() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });


      if (!response.ok) throw new Error('API response not OK');

      const data = await response.json();
      const analysisResults = data.results;

      const defaultedResults = {
        ...analysisResults,
        sentenceComplexity: analysisResults.sentenceComplexity || 0,
      };

      const submissionRef = await addDoc(collection(db, 'submissions'), {
        userId: currentUser.uid,
        title: title || 'Untitled Analysis',
        text,
        createdAt: serverTimestamp(),
        aiInfluence: defaultedResults.aiInfluence,
        score: defaultedResults.score,
        readabilityScore: defaultedResults.readabilityScore,
        sentenceComplexity: defaultedResults.sentenceComplexity,
        suggestions: defaultedResults.suggestions,
        strengths: defaultedResults.strengths,
        status: 'complete',
      });

      setResults({ id: submissionRef.id, ...defaultedResults });
      setSuccessMessage('');
    } catch (error) {
      console.error(error);
      setError('Failed to analyze text. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (text.length < minTextLength) {
      setError(`Text must be at least ${minTextLength} characters long`);
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, 'submissions'), {
        userId: currentUser.uid,
        title: title || 'Untitled Draft',
        text,
        createdAt: serverTimestamp(),
        status: 'draft',
      });

      // ✅ Reset fields and show success message
      setTitle('');
      setText('');
      setResults(null);
      setError('');
      setSuccessMessage('Draft saved successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNewAnalysis = () => {
    setTitle('');
    setText('');
    setResults(null);
    setSuccessMessage('');
  };

  return (
    <div className="text-analysis-container">
      <h1 className="text-analysis-title">Text Analysis</h1>

      {error && <div className="error-banner">{error}</div>}
      {successMessage && <div className="success-banner">{successMessage}</div>}

      {!results ? (
        <div className="text-analysis-form-wrapper">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="title">Title (Optional)</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your analysis a title"
              />
            </div>

            <div className="input-group">
              <label htmlFor="text">
                Your Text <span className="required">*</span>
              </label>
              <textarea
                id="text"
                rows="12"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or write your text here..."
                required
              />
              <p className="char-count">
                {text.length} / {minTextLength} characters minimum
              </p>
            </div>

            <div className="form-buttons btn-group-horizontal">
              <button
                type="submit"
                disabled={analyzing || text.length < minTextLength}
                className="btn-submit"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Text'}
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || text.length < minTextLength}
                className="btn-secondary"
              >💾
                <i className="fas fa-save mr-1"></i> {saving ? 'Saving...' : 'Save'}
              </button>

              <button
                type="button"
                onClick={() => setText('')}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-analysis-results">
          <h2 className="section-title">Analysis Results</h2>
          <p className="analysis-timestamp">
            Analyzed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>

          <div className="results-metrics">
            <div className="metric">
              <p>
                AI Influence
                <span className="tooltip-wrapper">
                  <span className="tooltip-icon">?</span>
                  <span className="tooltip-bubble">
                    Estimates how much of the text appears AI-generated based on patterns.
                  </span>
                </span>
              </p>
              <div className="progress-bar">
                <div
                  style={{ width: `${results.aiInfluence}%` }}
                  className={`progress-fill ${
                    results.aiInfluence > 50
                      ? 'bg-high'
                      : results.aiInfluence > 20
                      ? 'bg-medium'
                      : 'bg-low'
                  }`}
                ></div>
              </div>
              <p className="metric-value">
                {results.aiInfluence}%{' '}
                <span className="metric-label">
                  {results.aiInfluence > 50
                    ? 'High AI influence'
                    : results.aiInfluence > 20
                    ? 'Moderate AI influence'
                    : 'Low AI influence'}
                </span>
              </p>
            </div>

            <div className="metric">
              <p>
                Quality Score
                <span className="tooltip-wrapper">
                  <span className="tooltip-icon">?</span>
                  <span className="tooltip-bubble">
                    A score from 0 to 10 reflecting the overall writing quality.
                  </span>
                </span>
              </p>
              <p className="score-text">{results.score?.toFixed(2)}/10</p>
            </div>

            <div className="metric">
              <p>
                Readability
                <span className="tooltip-wrapper">
                  <span className="tooltip-icon">?</span>
                  <span className="tooltip-bubble">
                    Flesch-based score. Higher values mean easier to read.
                  </span>
                </span>
              </p>
              <p className="score-text">{results.readabilityScore?.toFixed(1)}/100</p>
              <p className="metric-label">{results.readabilityLevel} level</p>
            </div>

            <div className="metric">
              <p>
                Sentence Complexity
                <span className="tooltip-wrapper">
                  <span className="tooltip-icon">?</span>
                  <span className="tooltip-bubble">
                    Average words per sentence. Lower is usually easier to read.
                  </span>
                </span>
              </p>
              <GaugeChart
                id="sentence-complexity-meter"
                nrOfLevels={3}
                colors={['#2ECC71', '#F1C40F', '#E74C3C']}
                arcWidth={0.3}
                percent={Math.min(results.sentenceComplexity / 30, 1)}
                formatTextValue={() => `${results.sentenceComplexity.toFixed(1)} w/s`}
                textColor="#000"
              />
            </div>
          </div>

          <div className="text-analysis-tips">
            <div>
              <h3>Suggestions</h3>
              <ul>
                {results.suggestions?.map((s, i) => (
                  <li key={i}>
                    <span className="dot yellow"></span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Strengths</h3>
              <ul>
                {results.strengths?.map((s, i) => (
                  <li key={i}>
                    <span className="dot green"></span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="results-actions">
            <button onClick={handleNewAnalysis} className="btn-submit">
              New Analysis
            </button>
            <button onClick={() => navigate('/progress')} className="btn-secondary">
              View Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TextAnalysis;