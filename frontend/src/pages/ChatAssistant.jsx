import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import Spinner from '../components/ui/Spinner';

const SUGGESTED_PROMPTS = [
  'What can I make with leftover chicken and rice?',
  'How do I properly season a cast iron pan?',
  'What are good egg substitutes for baking?',
  'How long does cooked pasta keep in the fridge?',
  'What spices go well with salmon?',
  'How do I know when oil is hot enough to fry?',
];

function ChatMessage({ message, isNew }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>

      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-sm flex-shrink-0 shadow-glow-sm">
          🤖
        </div>
      )}

      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-primary-600 text-white rounded-br-sm'
          : 'bg-dark-800 text-dark-200 border border-dark-700/50 rounded-bl-sm'
      }`}>
        {message.content}
        <div className={`text-xs mt-1 ${isUser ? 'text-primary-300' : 'text-dark-600'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-dark-700 flex items-center justify-center text-sm flex-shrink-0">
          👤
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-sm flex-shrink-0">
        🤖
      </div>
      <div className="bg-dark-800 border border-dark-700/50 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  const { messages, isSending, isLoading, sendMessage, clearHistory } = useChat();
  const [input, setInput] = useState('');
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const previousLengthRef = useRef(0);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Track new messages
  useEffect(() => {
    if (messages.length > previousLengthRef.current) {
      const newIds = new Set();
      messages.slice(previousLengthRef.current).forEach(m => newIds.add(m.id || m._id));
      setNewMessageIds(newIds);
      setTimeout(() => setNewMessageIds(new Set()), 1000);
    }
    previousLengthRef.current = messages.length;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
    inputRef.current?.focus();
  };

  const handlePromptClick = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 pt-16 flex flex-col">
      <div className="page-container py-6 flex-1 flex flex-col max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              🤖 Chef AI Assistant
            </h1>
            <p className="text-dark-500 text-sm">Ask me anything about cooking, recipes, or ingredients</p>
          </div>
          {messages.length > 0 && (
            <button onClick={clearHistory} className="btn-ghost text-sm text-red-400 hover:text-red-300">
              Clear Chat
            </button>
          )}
        </motion.div>

        {/* Chat window */}
        <div className="glass-card flex-1 flex flex-col" style={{ minHeight: '500px', maxHeight: 'calc(100vh - 280px)' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-area">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="text-5xl mb-4 animate-bounce-subtle">🤖</div>
                <h3 className="font-display text-xl font-bold text-white mb-2">Hello! I'm Chef AI</h3>
                <p className="text-dark-400 max-w-sm">
                  I can help with recipes, cooking techniques, substitutions, food safety, and more!
                </p>

                {/* Suggested prompts */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button key={i} onClick={() => handlePromptClick(prompt)}
                      className="text-left text-sm text-dark-300 hover:text-white bg-dark-800 hover:bg-dark-700
                        border border-dark-700 hover:border-primary-500/30 rounded-xl px-3 py-2.5 transition-all">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg._id || msg.id}
                    message={msg}
                    isNew={newMessageIds.has(msg._id || msg.id)}
                  />
                ))}
                {isSending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-dark-700/50 p-4">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Chef AI anything... (Enter to send, Shift+Enter for new line)"
                rows={2}
                className="input-field flex-1 resize-none text-sm"
                style={{ minHeight: '56px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="btn-primary px-4 self-end flex-shrink-0">
                {isSending ? <Spinner size="sm" color="white" /> : '→'}
              </button>
            </div>
            <p className="text-dark-700 text-xs mt-2">
              💡 Try: "What spices pair with chicken?" or "How do I caramelize onions?"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
