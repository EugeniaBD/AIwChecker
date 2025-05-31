import React, { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import app from '../firebase/config';


const db = getFirestore(app);

function Help() {
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [tutorialQuery, setTutorialQuery] = useState('');
  const [gptTutorials, setGptTutorials] = useState('');
  const [isLoadingTutorials, setIsLoadingTutorials] = useState(false);

  const tutorials = [
    {
      id: 1,
      title: 'Getting Started with AIWriteCheck',
      description: 'Learn the basics of using our platform to analyze your writing',
      link: '#tutorial-1',
      youtubeId: 'h2FDq3agImI',
    },
    {
      id: 2,
      title: 'Understanding Your Analysis Results',
      description: 'How to interpret your scores and recommendations',
      link: '#tutorial-2',
      youtubeId: 'pV--MRVhs9o',
    },
    {
      id: 3,
      title: 'Tips for Reducing AI Influence in Your Writing',
      description: 'Practical strategies to make your writing more authentic',
      link: '#tutorial-3',
      youtubeId: 'yHk7Vavmc7Q',
    },
    {
      id: 4,
      title: 'Tracking Your Progress Over Time',
      description: 'How to use our progress tracking features effectively',
      link: '#tutorial-4',
      youtubeId: 'kbeeG5eKfHA',
    },
  ];

  const faqItems = [
    {
      id: 1,
      question: 'What does AIWriteCheck do?',
      answer: 'AIWriteCheck analyzes your text to detect patterns commonly associated with AI-generated content...',
    },
    {
      id: 2,
      question: 'How accurate is the AI detection?',
      answer: 'Our AI detection algorithm achieves approximately 85-90% accuracy...',
    },
    {
      id: 3,
      question: 'What is the "AI Influence" score?',
      answer: 'The AI Influence score represents the percentage of your text that exhibits AI-like patterns...',
    },
    {
      id: 4,
      question: 'How can I improve my writing based on the analysis?',
      answer: 'Aim to vary your sentence structures, use personal anecdotes...',
    },
    {
      id: 5,
      question: 'Can I check my writing multiple times?',
      answer: 'Yes! You can submit as many texts as you want for analysis...',
    },
    {
      id: 6,
      question: 'Is my writing data kept private?',
      answer: 'Absolutely. We take privacy seriously. Your texts are securely stored...',
    },
  ];

  const contactMethods = [
    {
      icon: 'fas fa-envelope',
      title: 'Email Support',
      description: 'Send us an email for direct assistance',
      contact: 'support@aiwritecheck.com',
      action: 'mailto:support@aiwritecheck.com',
    },
    {
      icon: 'fas fa-comments',
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available Monday-Friday, 9am-5pm EST',
      action: '#chat',
    },
    {
      icon: 'fas fa-phone-alt',
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      contact: '+1 (555) 123-4567',
      action: 'tel:+15551234567',
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await addDoc(collection(db, 'contactus'), {
        ...formData,
        timestamp: new Date(),
      });

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error('Error submitting message:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTutorialGptSearch = async () => {
    if (!tutorialQuery.trim()) return;

setIsLoadingTutorials(true);
setGptTutorials('');

try {const res = await fetch('http://localhost:4000/help', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: tutorialQuery }),
});


  const data = await res.json();
  setGptTutorials(data.answer || 'No suggestions returned.');
} catch (err) {
  console.error('GPT tutorial search failed:', err);
  setGptTutorials('Failed to return tutorial suggestions.');
} finally {
  setIsLoadingTutorials(false);
}

  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Help Center</h1>

      {/* 🔍 ChatGPT Tutorial Search */}
      <div className="mb-8">
        <div className="flex">
          <input
            type="text"
            placeholder="Ask ChatGPT for a tutorial..."
            value={tutorialQuery}
            onChange={(e) => setTutorialQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md"
          />
          <button
            onClick={handleTutorialGptSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
          >
            Search
          </button>
        </div>
        {isLoadingTutorials && <p className="text-sm text-gray-500 mt-2">Searching GPT...</p>}
        {gptTutorials && (
          <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-md text-gray-800 whitespace-pre-wrap">
            <strong>Suggestions from ChatGPT:</strong>
            <div className="mt-2">{gptTutorials}</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {/* Tabs */}
        <div className="flex border-b">
          {['faq', 'contact', 'tutorials'].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'faq' && <i className="fas fa-question-circle mr-2"></i>}
              {tab === 'contact' && <i className="fas fa-headset mr-2"></i>}
              {tab === 'tutorials' && <i className="fas fa-book-open mr-2"></i>}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'faq' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
                      onClick={() => toggleFaq(item.id)}
                    >
                      <span className="font-medium text-gray-800">{item.question}</span>
                      <i className={`fas ${expandedFaq === item.id ? 'fa-minus' : 'fa-plus'} text-blue-600`}></i>
                    </button>
                    {expandedFaq === item.id && (
                      <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-700">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Contact Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contactMethods.map((method, index) => (
                  <a
                    key={index}
                    href={method.action}
                    className="block bg-gray-50 border border-gray-200 rounded-lg p-6 hover:bg-gray-100 transition"
                  >
                    <div className="text-center">
                      <i className={`${method.icon} text-3xl text-blue-600 mb-3`}></i>
                      <h3 className="font-medium text-gray-800 mb-2">{method.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                      <p className="text-blue-600 font-medium">{method.contact}</p>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="font-medium text-gray-800 mb-3">Send Us a Message</h3>
                <form onSubmit={handleSubmit}>
                  {['name', 'email', 'subject', 'message'].map((field) => (
                    <div className="mb-4" key={field}>
                      <label
                        htmlFor={field}
                        className="block text-gray-700 text-sm font-medium mb-2 capitalize"
                      >
                        {field === 'message' ? 'Message' : `Your ${field}`}
                      </label>
                      {field === 'message' ? (
                        <textarea
                          id={field}
                          value={formData[field]}
                          onChange={handleInputChange}
                          rows="5"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                          required
                        ></textarea>
                      ) : (
                        <input
                          id={field}
                          type={field === 'email' ? 'email' : 'text'}
                          value={formData[field]}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                  {submitStatus && (
                    <div
                      className={`mt-4 p-4 border rounded-md ${
                        submitStatus === 'success'
                          ? 'bg-green-50 border-green-300 text-green-800'
                          : 'bg-red-50 border-red-300 text-red-800'
                      }`}
                    >
                      <i
                        className={`fas ${
                          submitStatus === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'
                        } mr-2`}
                      ></i>
                      {submitStatus === 'success'
                        ? 'Your message has been sent successfully.'
                        : 'There was a problem sending your message.'}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {activeTab === 'tutorials' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Video Tutorials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tutorials.map((tutorial) => (
                  <div
                    key={tutorial.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                  >
                    <div className="bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${tutorial.youtubeId}`}
                        title={tutorial.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-56"
                      ></iframe>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-800 mb-2">{tutorial.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{tutorial.description}</p>
                      <a href={tutorial.link} className="text-blue-600 text-sm underline">
                        Read more
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Help;
