'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Load saved chats from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem('savedChats');
    if (saved) {
      setSavedChats(JSON.parse(saved));
    }
    
    // Start a new chat
    startNewChat();
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedChats', JSON.stringify(savedChats));
  }, [savedChats]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    const newChatId = Date.now();
    setCurrentChatId(newChatId);
    setMessages([]);
    setInput('');
    setError('');
  };

  const saveCurrentChat = () => {
    if (messages.length === 0) return;
    
    const newChat = {
      id: currentChatId,
      title: messages[0]?.content.substring(0, 30) || 'New Chat',
      messages: [...messages],
      timestamp: new Date().toLocaleString(),
    };
    
    setSavedChats(prev => [newChat, ...prev.filter(chat => chat.id !== currentChatId)]);
  };

  const loadChat = (chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setInput('');
    setError('');
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
    
    if (currentChatId === chatId) {
      startNewChat();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Please enter a message');
      return;
    }

    // Add user message to chat
    const userMessage = { role: 'user', content: input, timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      // Call API with full conversation history
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Add AI response to chat
      const aiMessage = { role: 'assistant', content: data.response, timestamp: Date.now() };
      setMessages([...updatedMessages, aiMessage]);
      
      // Auto-save after each exchange
      setTimeout(() => saveCurrentChat(), 100);
      
    } catch (err) {
      setError(err.message);
      // Remove the user message if API fails
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">AI Prompt App</h1>
          <button
            onClick={startNewChat}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            + New Chat
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: Saved Chats */}
          <div className="md:col-span-1 bg-white rounded-lg shadow p-4 h-[600px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Saved Chats</h2>
              {savedChats.length > 0 && (
                <button
                  onClick={() => setSavedChats([])}
                  className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Clear All
                </button>
              )}
            </div>
            {savedChats.length === 0 ? (
              <p className="text-gray-500 text-sm">No saved chats yet</p>
            ) : (
              <div className="space-y-2">
                {savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => loadChat(chat)}
                    className={`p-2 rounded cursor-pointer group ${
                      currentChatId === chat.id ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium truncate text-sm">{chat.title}</div>
                        <div className="text-xs text-gray-500">{chat.timestamp}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {chat.messages.length} messages
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteChat(chat.id, e)}
                        className="text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: Chat Area */}
          <div className="md:col-span-2 bg-white rounded-lg shadow flex flex-col h-[600px]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-32">
                  <p>Start a conversation!</p>
                  <p className="text-sm mt-2">Type a message below to begin chatting with AI.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-4 mb-2 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <textarea
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="2"
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition self-end"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}