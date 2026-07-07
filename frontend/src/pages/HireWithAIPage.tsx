import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import './HireWithAIPage.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const suggestedPrompts = [
  'Write a job description for a Senior Software Engineer',
  'What are the top skills for a Product Manager role?',
  'Create an interview plan for a Data Scientist',
  'Suggest salary benchmarks for a DevOps role in Germany',
];

const aiReplies: Record<string, string> = {
  'Write a job description for a Senior Software Engineer': `**Senior Software Engineer**\n\nWe're looking for a Senior Software Engineer to join our growing product team. You'll design and build scalable backend and frontend systems, mentor junior engineers, and drive technical excellence.\n\n**Requirements:** 5+ years of professional experience · Proficiency in TypeScript, React, Node.js · Experience with cloud infrastructure (AWS/GCP) · Strong system design skills\n\n**Nice to have:** Prior startup experience · Contributions to open source · Familiarity with Kubernetes`,
};

export const HireWithAIPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', text: 'Hello! I\'m your AI hiring assistant. I can help you write job descriptions, create interview plans, benchmark salaries, and match candidates. What would you like to do today?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = aiReplies[text] || `I've noted your request: "${text}". I'm analyzing your hiring context and will generate a tailored recommendation. In a live environment this would query our AI engine with your company profile and role requirements.`;
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="hire-ai-page">
      <Navbar />

      <div className="hire-ai-page__container">
        {/* Sidebar */}
        <aside className="hire-ai-sidebar">
          <div className="hire-ai-sidebar__title">Quick Actions</div>
          {suggestedPrompts.map(prompt => (
            <button
              key={prompt}
              className="hire-ai-sidebar__prompt"
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}

          <div className="hire-ai-sidebar__divider" />
          <div className="hire-ai-sidebar__title">AI Features</div>
          <div className="hire-ai-feature">
            <span className="hire-ai-feature__icon">📝</span>
            <span>Job Description Generator</span>
          </div>
          <div className="hire-ai-feature">
            <span className="hire-ai-feature__icon">🎯</span>
            <span>Candidate Matching</span>
          </div>
          <div className="hire-ai-feature">
            <span className="hire-ai-feature__icon">📊</span>
            <span>Salary Benchmarking</span>
          </div>
          <div className="hire-ai-feature">
            <span className="hire-ai-feature__icon">📋</span>
            <span>Interview Planning</span>
          </div>
          <div className="hire-ai-feature">
            <span className="hire-ai-feature__icon">🔍</span>
            <span>Bias Detection</span>
          </div>
        </aside>

        {/* Chat Area */}
        <div className="hire-ai-chat">
          {/* Chat header */}
          <div className="hire-ai-chat__header">
            <div className="hire-ai-chat__avatar">🤖</div>
            <div>
              <div className="hire-ai-chat__name">Ornave Hiring AI</div>
              <div className="hire-ai-chat__status">● Online</div>
            </div>
          </div>

          {/* Messages */}
          <div className="hire-ai-chat__messages">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`hire-ai-msg hire-ai-msg--${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <div className="hire-ai-msg__avatar">🤖</div>
                )}
                <div className="hire-ai-msg__bubble">
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className="hire-ai-msg__line">{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="hire-ai-msg hire-ai-msg--assistant">
                <div className="hire-ai-msg__avatar">🤖</div>
                <div className="hire-ai-msg__bubble hire-ai-msg__bubble--typing">
                  <span className="hire-ai-typing-dot" />
                  <span className="hire-ai-typing-dot" />
                  <span className="hire-ai-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="hire-ai-chat__input-area">
            <input
              type="text"
              className="hire-ai-chat__input"
              placeholder="Ask me anything about hiring..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(input); }}
            />
            <button
              className="hire-ai-chat__send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
