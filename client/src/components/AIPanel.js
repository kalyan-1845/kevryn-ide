import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import {
    FaPaperPlane, FaRobot, FaSpinner, FaCheck, FaTimes, FaKey,
    FaSearch, FaBug, FaBolt, FaMagic, FaComment, FaCopy, FaCode,
    FaTrash, FaChevronDown, FaChevronUp, FaEye, FaTerminal,
    FaPlus, FaHistory, FaEllipsisV
} from 'react-icons/fa';

const _rawServerUrl = (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim();
const SERVER_URL = _rawServerUrl.startsWith('http') ? _rawServerUrl : `https://${_rawServerUrl}`;

const AIPanel = ({ token, code, fileName, language, onApplyCode }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [groqStatus, setGroqStatus] = useState({ available: false, provider: 'groq' });
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [isSettingKey, setIsSettingKey] = useState(false);
    const [activeAction, setActiveAction] = useState(null);
    const [showActions, setShowActions] = useState(true);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [mode, setMode] = useState('chat'); // 'chat' | 'auto-dev'
    const chatEndRef = useRef(null);

    const models = [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Balanced' },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku', desc: 'Creative' },
        { id: 'llama-3', name: 'Llama 3 70B', desc: 'Power' },
        { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', desc: 'Logic' },
        { id: 'groq', name: 'Groq Core', desc: 'Instant' }
    ];

    const api = useMemo(() => axios.create({ baseURL: SERVER_URL, headers: { Authorization: token } }), [token]);

    useEffect(() => {
        checkGroqStatus();

        // --- GLOBAL ACCESS FOR TRIGGERING CHAT ---
        window.triggerAiChat = (msg) => {
            setInput(msg);
            setTimeout(() => {
                const sendBtn = document.querySelector('.ai-send-btn');
                if (sendBtn) sendBtn.click();
            }, 100);
        };

        return () => {
            delete window.triggerAiChat;
        };
    }, [token, setInput]);

    const fetchSessions = async () => {
        try {
            const response = await api.get('/ai/sessions');
            setSessions(response.data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    const loadSession = async (sessionId) => {
        setIsLoading(true);
        setShowHistory(false);
        try {
            const response = await api.get(`/ai/sessions/${sessionId}`);
            const session = response.data.session;
            setMessages(session.messages);
            setCurrentSessionId(session._id);
        } catch (error) {
            console.error('Failed to load session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSession = async (e, sessionId) => {
        e.stopPropagation();
        try {
            await api.delete(`/ai/sessions/${sessionId}`);
            setSessions(prev => prev.filter(s => s._id !== sessionId));
            if (currentSessionId === sessionId) {
                newChat();
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const newChat = () => {
        setMessages([]);
        setCurrentSessionId(null);
        setMode('chat');
        setShowHistory(false);
    };

    const checkGroqStatus = async () => {
        try {
            const response = await axios.get(`${SERVER_URL}/ai/status`);
            setGroqStatus(response.data);
        } catch (error) {
            console.error('Failed to check Groq status:', error);
        }
    };

    const submitApiKey = async () => {
        if (!apiKeyInput.trim()) return;
        setIsSettingKey(true);
        try {
            await axios.post(`${SERVER_URL}/ai/api-key`, { apiKey: apiKeyInput.trim() });
            setApiKeyInput('');
            await checkGroqStatus();
        } catch (error) {
            console.error('Failed to set API key:', error);
        } finally {
            setIsSettingKey(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Extract code blocks from markdown for Apply/Copy buttons
    const renderMessageContent = useCallback((content, msgIndex) => {
        const html = marked(content);

        // Split content by code blocks to add action buttons
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        let blockIndex = 0;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Text before code block
            if (match.index > lastIndex) {
                const textBefore = content.substring(lastIndex, match.index);
                parts.push(
                    <div key={`text-${blockIndex}`}
                        dangerouslySetInnerHTML={{ __html: marked(textBefore) }}
                        className="ai-text-content"
                    />
                );
            }

            const codeLang = match[1] ? match[1].toLowerCase() : 'code';
            const terminalLangs = ['powershell', 'bash', 'shell', 'sh', 'cmd', 'zsh', 'terminal'];
            const isTerminal = terminalLangs.includes(codeLang);

            const codeContent = match[2].trim();
            const currentBlockIndex = `${msgIndex}-${blockIndex}`;

            parts.push(
                <div key={`code-${blockIndex}`} className="ai-code-block">
                    <div className="ai-code-header">
                        <span className="ai-code-lang">{codeLang}</span>
                        <div className="ai-code-actions">
                            <button
                                className="ai-code-btn"
                                onClick={() => copyToClipboard(codeContent, currentBlockIndex)}
                                title="Copy code"
                            >
                                {copiedIndex === currentBlockIndex ?
                                    <><FaCheck size={10} /> Copied!</> :
                                    <><FaCopy size={10} /> Copy</>
                                }
                            </button>
                            {onApplyCode && (
                                <button
                                    className="ai-code-btn ai-apply-btn"
                                    onClick={() => onApplyCode(codeContent, codeLang)}
                                    title={isTerminal ? "Run in Terminal" : "Apply to editor"}
                                >
                                    {isTerminal ? <FaTerminal size={10} /> : <FaCode size={10} />}
                                    {isTerminal ? " Run" : " Apply"}
                                </button>
                            )}
                        </div>
                    </div>
                    <pre className="ai-code-pre"><code>{codeContent}</code></pre>
                </div>
            );

            lastIndex = match.index + match[0].length;
            blockIndex++;
        }

        // Remaining text after last code block
        if (lastIndex < content.length) {
            const remaining = content.substring(lastIndex);
            parts.push(
                <div key={`text-end`}
                    dangerouslySetInnerHTML={{ __html: marked(remaining) }}
                    className="ai-text-content"
                />
            );
        }

        return parts.length > 0 ? parts : (
            <div dangerouslySetInnerHTML={{ __html: html }} className="ai-text-content" />
        );
    }, [copiedIndex, onApplyCode]);

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Quick Actions
    const quickActions = [
        { id: 'explain', label: 'Explain', icon: <FaSearch size={11} />, color: '#3b82f6', endpoint: '/ai/explain', dataKey: 'explanation' },
        { id: 'fix', label: 'Fix Bugs', icon: <FaBug size={11} />, color: '#ef4444', endpoint: '/ai/fix', dataKey: 'fixed' },
        { id: 'optimize', label: 'Optimize', icon: <FaBolt size={11} />, color: '#f59e0b', endpoint: '/ai/optimize', dataKey: 'optimized' },
        { id: 'generate', label: 'Generate', icon: <FaMagic size={11} />, color: '#8b5cf6', endpoint: '/ai/generate', dataKey: 'generated' },
        { id: 'comment', label: 'Comment', icon: <FaComment size={11} />, color: '#10b981', endpoint: '/ai/comment', dataKey: 'commented' },
        { id: 'auto-dev', label: 'Auto-Dev', icon: <FaRobot size={11} />, color: '#f43f5e', endpoint: '/ai/auto/plan', dataKey: 'plan' },
    ];


    // Handle Quick Action Click
    const handleQuickAction = async (action) => {
        if (action.id === 'auto-dev') {
            setMode(mode === 'auto-dev' ? 'chat' : 'auto-dev');
            return;
        }

        if (!code && (!input.trim() || input === '')) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Please open a file or enter a prompt first.' }]);
            return;
        }

        setActiveAction(action.id);
        setIsLoading(true);

        // Context message
        setMessages(prev => [...prev, {
            role: 'user',
            content: `🔧 **${action.label}** : ${fileName || 'No file'}`
        }]);

        try {
            let response;
            if (action.id === 'generate') {
                const description = input.trim() || 'Improve this code';
                response = await api.post(action.endpoint, { description, language: language || 'javascript', model: selectedModel });
            } else {
                response = await api.post(action.endpoint, { code, language: language || 'javascript', model: selectedModel });
            }

            const aiResponse = response.data[action.dataKey] || response.data.response || 'No response';
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
            setInput('');
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${error.response?.data?.error || error.message}` }]);
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };


    const handleDiffReview = async (filePlan) => {
        try {
            let oldCode = "";
            // If it's the currently open file, use the editor code
            if (fileName === filePlan.path) {
                oldCode = code;
            } else {
                // Fetch current content from DB
                const res = await api.get('/files');
                const existing = res.data.find(f => f.name === filePlan.path);
                if (existing) {
                    oldCode = existing.content || "";
                }
            }

            if (window.openDiff) {
                window.openDiff({
                    oldCode,
                    newCode: filePlan.content || "// No content change",
                    fileName: filePlan.path,
                    language: language || 'javascript',
                    onApply: (finalCode) => {
                        filePlan.content = finalCode;
                    }
                });
            }
        } catch (e) {
            console.error("Diff Review Error:", e);
        }
    };

    const executePlan = async (plan, msgIndex) => {
        try {
            setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, executed: 'loading' } : m));

            if (window.handleAutoDevExecution) {
                await window.handleAutoDevExecution(plan);
                setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, executed: 'success' } : m));
            } else {
                alert("Auto-Dev execution handler missing. Please refresh the page.");
                setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, executed: 'error' } : m));
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, executed: 'error' } : m));
        }
    };


    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const currentInput = input;
        const userMessage = { role: 'user', content: currentInput };
        
        // Update UI immediately
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Prepare messages for the API (including the new one)
        const messagesToAI = [...messages, userMessage];

        try {
            if (mode === 'auto-dev') {
                const response = await api.post('/ai/auto/plan', { 
                    prompt: currentInput, 
                    model: selectedModel, 
                    sessionId: currentSessionId 
                });
                const aiResponse = response.data.plan;
                if (response.data.sessionId) setCurrentSessionId(response.data.sessionId);
                
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    type: 'plan',
                    content: aiResponse
                }]);
            } else {
                const response = await api.post('/ai/chat', {
                    messages: messagesToAI,
                    model: selectedModel,
                    sessionId: currentSessionId
                });

                if (response.data.sessionId) setCurrentSessionId(response.data.sessionId);
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
            }

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ ${error.response?.data?.error || error.response?.data || error.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => setMessages([]);

    return (
        <div className="ai-panel">
            {/* Header */}
            <div className="ai-header">
                <div className="ai-header-left">
                    <div className="ai-logo">
                        <FaRobot size={14} />
                    </div>
                    <span className="ai-title">Kevryn AI</span>
                    <select
                        className="ai-model-selector"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                    >
                        {models.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
                <div className="ai-header-right">
                    <button onClick={newChat} className="ai-header-btn" title="New Chat">
                        <FaPlus size={12} />
                    </button>
                    <button onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchSessions(); }} className={`ai-header-btn ${showHistory ? 'active' : ''}`} title="History">
                        <FaHistory size={12} />
                    </button>
                    <button className="ai-header-btn" title="Menu">
                        <FaEllipsisV size={12} />
                    </button>
                </div>
            </div>

            {/* History View Overlay */}
            {showHistory && (
                <div className="ai-history-overlay">
                    <div className="ai-history-header">
                        <span>Chat History</span>
                        <FaTimes className="close-history" onClick={() => setShowHistory(false)} />
                    </div>
                    <div className="ai-history-list">
                        {sessions.length === 0 ? (
                            <div className="no-history">No past conversations</div>
                        ) : (
                            sessions.map(s => (
                                <div key={s._id} className={`history-item ${currentSessionId === s._id ? 'active' : ''}`} onClick={() => loadSession(s._id)}>
                                    <div className="history-info">
                                        <div className="history-title">{s.title || 'New Chat'}</div>
                                        <div className="history-date">{new Date(s.updatedAt).toLocaleDateString()}</div>
                                    </div>
                                    <FaTrash className="delete-history" onClick={(e) => deleteSession(e, s._id)} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* API Key Input (Only show if groq selected and not available) */}
            {selectedModel === 'groq' && !groqStatus.available && (
                <div className="ai-key-setup">
                    <div className="ai-key-title">
                        <FaKey size={12} /> Link Kevryn AI Core
                    </div>
                    <p className="ai-key-desc">
                        Enter your Groq API key for zero-latency responses.
                    </p>
                    <div className="ai-key-input-row">
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="gsk_..."
                            onKeyDown={(e) => e.key === 'Enter' && submitApiKey()}
                            className="ai-key-input"
                        />
                        <button
                            onClick={submitApiKey}
                            disabled={isSettingKey || !apiKeyInput.trim()}
                            className="ai-key-btn"
                        >
                            {isSettingKey ? <FaSpinner className="spinning" size={12} /> : 'Link'}
                        </button>
                    </div>
                </div>
            )}

            {/* Context Bar */}
            {fileName && fileName !== '' && (
                <div className="ai-context-bar">
                    <span className="ai-context-file">
                        📄 {fileName}
                    </span>
                    <span className="ai-context-lang">{language || 'plaintext'}</span>
                </div>
            )}

            {/* Quick Actions */}
            <div className="ai-actions-section">
                <div
                    className="ai-actions-toggle"
                    onClick={() => setShowActions(!showActions)}
                >
                    <span>Capabilities</span>
                    {showActions ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </div>
                {showActions && (
                    <div className="ai-actions-grid">
                        {quickActions.map(action => (
                            <button
                                key={action.id}
                                className={`ai-action-btn ${(activeAction === action.id || (action.id === 'auto-dev' && mode === 'auto-dev')) ? 'active' : ''}`}
                                onClick={() => handleQuickAction(action)}
                                disabled={isLoading}
                                style={{ '--action-color': action.color }}
                                title={action.label}
                            >
                                {activeAction === action.id ? (
                                    <FaSpinner className="spinning" size={11} />
                                ) : (
                                    action.icon
                                )}
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="ai-messages">
                {messages.length === 0 && (
                    <div className="ai-welcome">
                        <div className="ai-welcome-icon">
                            <FaRobot size={28} />
                        </div>
                        <div className="ai-welcome-title">Kevryn AI Agent</div>
                        <div className="ai-welcome-subtitle">
                            {mode === 'auto-dev' ? <span style={{ color: '#f43f5e' }}>Complete Project Builder Mode</span> : "Ready to accelerate your development."}
                        </div>
                        {mode !== 'auto-dev' && <div className="ai-welcome-hints">
                            <span className="ai-hint" onClick={() => setInput('Explain this code')}>
                                "Explain this code"
                            </span>
                            <span className="ai-hint" onClick={() => setInput('Find bugs in my code')}>
                                "Find bugs"
                            </span>
                        </div>}
                        {mode === 'auto-dev' && <div className="ai-welcome-hints">
                            <span className="ai-hint" onClick={() => setInput('Build a full auth system')}>
                                "Build a full auth system"
                            </span>
                            <span className="ai-hint" onClick={() => setInput('Create a responsive portfolio')}>
                                "Create a portfolio"
                            </span>
                        </div>}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`ai-message ai-message-${msg.role}`}>
                        {msg.role === 'assistant' && (
                            <div className="ai-avatar">
                                <FaRobot size={10} />
                            </div>
                        )}
                        <div className={`ai-bubble ai-bubble-${msg.role}`}>
                            {msg.type === 'plan' ? (
                                <div className="ai-plan-card">
                                    <div className="ai-plan-header">
                                        <FaMagic className="ai-plan-icon" />
                                        <span>Implementation Plan</span>
                                    </div>
                                    <div className="ai-plan-explanation">{msg.content.explanation}</div>

                                    <div className="ai-plan-section">
                                        <strong>Files ({msg.content.files?.length || 0})</strong>
                                        <ul className="ai-plan-list">
                                            {msg.content.files?.map((f, idx) => (
                                                <li key={idx} className="ai-plan-item">
                                                    <div className="ai-plan-item-left">
                                                        <span className={`badge badge-${f.action}`}>{f.action}</span>
                                                        <span className="file-path">{f.path}</span>
                                                    </div>
                                                    {(f.action === 'create' || f.action === 'update') && (
                                                        <button className="btn-review-diff" onClick={() => handleDiffReview(f)} title="Review Changes">
                                                            <FaEye /> View Code
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="ai-plan-section">
                                        <strong>Magic Commands</strong>
                                        {msg.content.commands?.length > 0 ? (
                                            <div className="ai-plan-commands">
                                                {msg.content.commands.map((cmd, idx) => (
                                                    <div key={idx} className="ai-cmd">{cmd}</div>
                                                ))}
                                            </div>
                                        ) : <div className="text-muted">None</div>}
                                    </div>

                                    <div className="ai-plan-actions">
                                        {msg.executed === 'success' ? (
                                            <div className="ai-success-msg"><FaCheck /> Mission Accomplished!</div>
                                        ) : msg.executed === 'loading' ? (
                                            <div className="ai-loading-msg"><FaSpinner className="spinning" /> Performing Magic...</div>
                                        ) : msg.executed === 'error' ? (
                                            <div className="ai-error-msg"><FaTimes /> Magic Failed</div>
                                        ) : (
                                            <>
                                                <button className="btn-approve" onClick={() => executePlan(msg.content, i)}>
                                                    <FaCheck /> Build Project
                                                </button>
                                                <button className="btn-reject" onClick={() => setMessages(prev => prev.filter((_, idx) => idx !== i))}>
                                                    <FaTimes /> Cancel
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                msg.role === 'assistant'
                                    ? renderMessageContent(msg.content, i)
                                    : <span>{msg.content}</span>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="ai-message ai-message-assistant">
                        <div className="ai-avatar">
                            <FaRobot size={10} />
                        </div>
                        <div className="ai-thinking">
                            <div className="ai-thinking-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="ai-input-form">
                <div className="ai-input-wrapper" style={{ borderColor: mode === 'auto-dev' ? '#f43f5e' : '' }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === 'auto-dev' ? "What should we build today?" : "Ask Kevryn AI..."}
                        disabled={isLoading}
                        className="ai-input"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="ai-send-btn"
                        style={{ color: mode === 'auto-dev' ? '#f43f5e' : '' }}
                    >
                        {mode === 'auto-dev' ? <FaMagic size={14} /> : <FaPaperPlane size={12} />}
                    </button>
                </div>
                <div className="ai-input-footer">
                    {mode === 'auto-dev' ? 'Kevryn Project Builder' : `${models.find(m => m.id === selectedModel)?.name} · ${models.find(m => m.id === selectedModel)?.desc}`}
                </div>
            </form>
        </div>
    );
};

export default AIPanel;
