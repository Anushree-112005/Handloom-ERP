/**
 * UniversalChatbot — Global floating AI assistant for Dinesh Textile ERP.
 *
 * Features:
 * - Floating action button (bottom-right)
 * - Slide-up chat panel with message history
 * - Report download buttons for AI-generated attachments
 * - Suggestion chips for quick actions
 * - Context-aware: sends current route and filters to backend
 * - Persistent thread per session
 * - Markdown-like formatting in AI responses
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare, X, Send, Download, FileText, Sparkles,
  Bot, User, Loader2, ChevronDown, Minimize2, Maximize2
} from 'lucide-react';
import { chatbotAPI, downloadReport } from '../services/chatbotAPI';

const THREAD_KEY = 'erp_chat_thread_id';

function getOrCreateThreadId() {
  let id = sessionStorage.getItem(THREAD_KEY);
  if (!id) {
    id = `thread-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(THREAD_KEY, id);
  }
  return id;
}

export default function UniversalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      message: "Hello! 👋 I'm your **Dinesh Exports ERP Assistant**. I can generate reports, query data, and help you navigate the system.\n\nTry asking:\n• \"Download buyer order report as PDF\"\n• \"List available reports\"\n• \"Show invoices for this month\"",
      attachments: [],
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId] = useState(getOrCreateThreadId);
  const [suggestions, setSuggestions] = useState([
    'List available reports',
    'Download buyer order report as PDF',
    'Show invoices for this month',
  ]);
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Build context from current route
  const getContext = useCallback(() => {
    const path = location.pathname;
    const routeParts = path.split('/').filter(Boolean);
    return {
      route: path,
      module: routeParts[0] || 'dashboard',
    };
  }, [location.pathname]);

  const handleSend = async (text = null) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', message: msg, attachments: [] }]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const res = await chatbotAPI.sendMessage(threadId, msg, getContext());
      const data = res.data;

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          message: data.reply,
          attachments: data.attachments || [],
        }
      ]);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMsg = err.response?.status === 401
        ? 'Please log in to use the chatbot.'
        : 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [
        ...prev,
        { sender: 'ai', message: `❌ ${errorMsg}`, attachments: [] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownload = async (attachment) => {
    const jobId = attachment.job_id;
    setDownloadingIds(prev => new Set(prev).add(jobId));
    try {
      await downloadReport(attachment.download_url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    // Simple markdown-like rendering
    return text.split('\n').map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (rendered.startsWith('• ') || rendered.startsWith('- ')) {
        rendered = `<span style="display:flex;gap:6px;"><span style="color:var(--primary)">•</span><span>${rendered.slice(2)}</span></span>`;
      }
      return <div key={i} dangerouslySetInnerHTML={{ __html: rendered || '&nbsp;' }} />;
    });
  };

  // Panel dimensions
  const panelStyle = isExpanded
    ? { width: '520px', height: '680px' }
    : { width: '400px', height: '560px' };

  return (
    <>
      {/* ── Floating Action Button ─────────────────────────────── */}
      {!isOpen && (
        <button
          id="chatbot-fab"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(79,70,229,0.4), 0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 9999,
            transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
            animation: 'chatbot-pulse 2s infinite',
          }}
          onMouseEnter={e => { e.target.style.transform = 'scale(1.1)'; e.target.style.boxShadow = '0 12px 32px rgba(79,70,229,0.5)'; }}
          onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 8px 24px rgba(79,70,229,0.4)'; }}
          title="Open ERP Assistant"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* ── Chat Panel ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          id="chatbot-panel"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            ...panelStyle,
            maxHeight: 'calc(100vh - 48px)',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'chatbot-slideUp 0.3s ease-out',
            border: '1px solid rgba(226,232,240,0.6)',
          }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={20} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>
                  ERP Assistant
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                  Dinesh Exports Intelligence
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '8px', padding: '6px', cursor: 'pointer',
                  color: 'white', display: 'flex',
                }}
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  borderRadius: '8px', padding: '6px', cursor: 'pointer',
                  color: 'white', display: 'flex',
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Messages Area ──────────────────────────────────── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f8fafc',
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '30px', height: '30px', borderRadius: '10px',
                  background: msg.sender === 'user'
                    ? 'linear-gradient(135deg, #0891b2, #06b6d4)'
                    : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {msg.sender === 'user'
                    ? <User size={14} color="white" />
                    : <Bot size={14} color="white" />
                  }
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: '82%',
                  background: msg.sender === 'user' ? '#4f46e5' : 'white',
                  color: msg.sender === 'user' ? 'white' : '#1e293b',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  boxShadow: msg.sender === 'user' ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                }}>
                  {renderMarkdown(msg.message)}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {msg.attachments.map((att, aidx) => (
                        <button
                          key={aidx}
                          onClick={() => handleDownload(att)}
                          disabled={downloadingIds.has(att.job_id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #059669, #047857)',
                            color: 'white', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600,
                            transition: 'all 0.2s ease',
                            opacity: downloadingIds.has(att.job_id) ? 0.7 : 1,
                          }}
                        >
                          {downloadingIds.has(att.job_id)
                            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Download size={14} />
                          }
                          {att.label}
                          <span style={{
                            background: 'rgba(255,255,255,0.2)', padding: '2px 6px',
                            borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase',
                          }}>
                            {att.format}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Bot size={14} color="white" />
                </div>
                <div style={{
                  background: 'white', padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
                  border: '1px solid #e2e8f0', display: 'flex', gap: '6px', alignItems: 'center',
                }}>
                  <div className="chatbot-typing-dot" style={{ animationDelay: '0ms' }} />
                  <div className="chatbot-typing-dot" style={{ animationDelay: '150ms' }} />
                  <div className="chatbot-typing-dot" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Suggestion Chips ───────────────────────────────── */}
          {suggestions.length > 0 && !isLoading && (
            <div style={{
              padding: '8px 16px', display: 'flex', gap: '6px',
              flexWrap: 'wrap', borderTop: '1px solid #e2e8f0',
              background: 'white', flexShrink: 0,
            }}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  style={{
                    padding: '5px 12px', borderRadius: '100px',
                    background: '#eef2ff', border: '1px solid #c7d2fe',
                    color: '#4f46e5', fontSize: '11px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.target.style.background = '#4f46e5'; e.target.style.color = 'white'; }}
                  onMouseLeave={e => { e.target.style.background = '#eef2ff'; e.target.style.color = '#4f46e5'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* ── Input Area ─────────────────────────────────────── */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #e2e8f0',
            background: 'white', flexShrink: 0,
          }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about reports, data, or ERP..."
                disabled={isLoading}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '12px',
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  fontSize: '13px', color: '#1e293b', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: input.trim() ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e2e8f0',
                  color: input.trim() ? 'white' : '#94a3b8',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease', flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </form>
            <div style={{
              textAlign: 'center', fontSize: '10px', color: '#94a3b8',
              marginTop: '6px',
            }}>
              Dinesh Exports ERP • AI Assistant
            </div>
          </div>
        </div>
      )}

      {/* ── Inline Styles ──────────────────────────────────────── */}
      <style>{`
        @keyframes chatbot-pulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(79,70,229,0.4); }
          50% { box-shadow: 0 8px 32px rgba(79,70,229,0.6), 0 0 0 8px rgba(79,70,229,0.1); }
        }
        @keyframes chatbot-slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .chatbot-typing-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #94a3b8;
          animation: chatbot-dotBounce 1.2s infinite ease-in-out;
        }
        @keyframes chatbot-dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        #chatbot-panel::-webkit-scrollbar { width: 4px; }
        #chatbot-panel *::-webkit-scrollbar { width: 4px; }
        #chatbot-panel *::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </>
  );
}
