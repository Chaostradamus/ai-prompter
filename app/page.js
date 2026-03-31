
'use client';

import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  // Load chat history from localStorage when page loads
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(history));
  }, [history]);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Call our API route
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResponse(data.response);

      // Add to chat history
      const newEntry = {
        id: Date.now(),
        prompt: prompt,
        response: data.response,
        timestamp: new Date().toLocaleString(),
      };
      setHistory([newEntry, ...history]); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('chatHistory');
  };

  const loadConversation = (entry) => {
    setPrompt(entry.prompt);
    setResponse(entry.response);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">AI Prompt App</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: Chat History */}
          <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">History</h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => loadConversation(entry)}
                    className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 text-sm"
                  >
                    <div className="font-medium truncate">{entry.prompt}</div>
                    <div className="text-xs text-gray-500">{entry.timestamp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: Main chat area */}
          <div className="md:col-span-2">
            {/* Input area */}
            <div className="mb-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Loading...' : 'Submit'}
            </button>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Response display */}
            {response && (
              <div className="mt-6">
                <h2 className="font-semibold mb-2">Response:</h2>
                <div className="p-4 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}