import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { marked } from 'marked';
import {
    FaPaperPlane, FaRobot, FaSpinner, FaCheck, FaTimes, 
    FaSearch, FaBug, FaBolt, FaMagic, FaComment, FaCopy, FaCode,
    FaTrash, FaEye, FaTerminal, FaPlus, FaHistory, FaEllipsisV
} from 'react-icons/fa';

const _rawServerUrl = (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim();
const SERVER_URL = _rawServerUrl.startsWith('http') ? _rawServerUrl : `https://${_rawServerUrl}`;

const AIPanel = ({ token, code, fileName, language, onApplyCode }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [agentStatus, setAgentStatus] = useState(null); // Real-time agent status (telemetry)
    const [activeAction, setActiveAction] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    
    // Model Selection State
    const [modelSource, setModelSource] = useState('cloud_gemini'); // cloud_gemini | local_fast | local_balanced | local_advanced | local_expert
    const [localModels, setLocalModels] = useState(null); // Full status object from backend
    
    const [mode, setMode] = useState('auto-dev'); 
    
    const chatEndRef = useRef(null);
    const api = useMemo(() => axios.create({ baseURL: SERVER_URL, headers: { Authorization: token } }), [token]);

    useEffect(() => {
        window.triggerAiChat = (msg) => {
            setInput(msg);
            setTimeout(() => {
                const sendBtn = document.querySelector('.ai-send-btn');
                if (sendBtn) sendBtn.click();
            }, 100);
        };

        // Listen for internal Agent Telemetry emitted globally by App.js
        const handleTelemetry = (e) => {
            if (e.detail?.message) setAgentStatus(e.detail.message);
            if (e.detail?.status === 'complete') setAgentStatus(null);
        };
        window.addEventListener('agent-telemetry', handleTelemetry);

        return () => {
            delete window.triggerAiChat;
            window.removeEventListener('agent-telemetry', handleTelemetry);
        };
    }, [token, setInput]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, agentStatus]);

    const fetchSessions = async () => {
        try {
            const response = await api.get('/ai/sessions');
            setSessions(response.data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    const fetchLocalModelsStatus = useCallback(async () => {
        try {
            const response = await api.get('/ai/local/status');
            setLocalModels(response.data);
        } catch (error) {
            console.error('Failed to fetch local model status', error);
        }
    }, [api]);

    // Check local status on mount
    useEffect(() => {
        fetchLocalModelsStatus();
    }, [fetchLocalModelsStatus]);

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
            if (currentSessionId === sessionId) newChat();
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const newChat = () => {
        setMessages([]);
        setCurrentSessionId(null);
        setShowHistory(false);
        setAgentStatus(null);
    };

    // Auto Code Execution from earlier logic
    const handleDiffReview = async (filePlan) => {
        try {
            let oldCode = fileName === filePlan.path ? code : "";
            if (window.openDiff) {
                window.openDiff({
                    oldCode,
                    newCode: filePlan.content || "// No content change",
                    fileName: filePlan.path,
                    language: language || 'javascript',
                    onApply: (finalCode) => { filePlan.content = finalCode; }
                });
            }
        } catch (e) {
            console.error("Diff Review Error:", e);
        }
    };

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const renderMessageContent = useCallback((content, msgIndex) => {
        const html = marked(content);
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        let blockIndex = 0;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                const textBefore = content.substring(lastIndex, match.index);
                parts.push(<div key={`text-${blockIndex}`} dangerouslySetInnerHTML={{ __html: marked(textBefore) }} className="ai-text-content" />);
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
                            <button className="ai-code-btn" onClick={() => copyToClipboard(codeContent, currentBlockIndex)}>
                                {copiedIndex === currentBlockIndex ? <><FaCheck size={10} /> Copied!</> : <><FaCopy size={10} /> Copy</>}
                            </button>
                            {onApplyCode && (
                                <button className="ai-code-btn ai-apply-btn" onClick={() => onApplyCode(codeContent, codeLang)}>
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

        if (lastIndex < content.length) {
            const remaining = content.substring(lastIndex);
            parts.push(<div key={`text-end`} dangerouslySetInnerHTML={{ __html: marked(remaining) }} className="ai-text-content" />);
        }

        return parts.length > 0 ? parts : <div dangerouslySetInnerHTML={{ __html: html }} className="ai-text-content" />;
    }, [copiedIndex, onApplyCode]);

    const handleQuickAction = async (endpoint, label) => {
        if (!code && (!input.trim() || input === '')) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Please open a file or enter a prompt first.' }]);
            return;
        }

        setActiveAction(label);
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', content: `🔧 **${label}** : ${fileName || 'No file'}` }]);

        try {
            const response = await api.post(endpoint, { code, language: language || 'javascript' });
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.response || 'No response' }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${error.response?.data?.error || error.message}` }]);
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    const executeAutonomousPlan = async (instructions) => {
        setIsLoading(true);
        setAgentStatus(`Initializing ${modelSource.startsWith('local_') ? 'Cloud Open AI' : 'Cloud Agent'} analysis...`);
        setMessages(prev => [...prev, { role: 'user', content: instructions }]);

        try {
            let endpoint = '/ai/agent/run';
            let payload = { prompt: instructions, sessionId: currentSessionId };

            // If a local model is selected, route to the local agent endpoint
            if (modelSource.startsWith('local_')) {
                endpoint = '/ai/local/agent/run';
                payload.tier = modelSource.split('local_')[1]; // e.g. 'fast', 'expert'
            }

            const response = await api.post(endpoint, payload);
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
            if (response.data.sessionId) setCurrentSessionId(response.data.sessionId);
        } catch (error) {
            console.error("Agent Error:", error);
            const errorMsg = error.response?.data?.error || error.message;
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Agent crashed: ${errorMsg}` }]);
        } finally {
            setIsLoading(false);
            setAgentStatus(null);
        }
    };

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const currentInput = input;
        setInput('');
        
        // Push user message, then hand off to Agent Loop
        await executeAutonomousPlan(currentInput);
    };

    return (
        <div className="ai-panel">
            <div className="ai-header">
                <div className="ai-header-left">
                    <div className="ai-logo"><FaMagic size={14} /></div>
                    <span className="ai-title">Kevryn AI</span>
                    <select 
                        className="ai-model-selector" 
                        value={modelSource} 
                        onChange={(e) => setModelSource(e.target.value)}
                    >
                        <option value="cloud_gemini">🚀 Kevryn Cloud (Flash)</option>
                        <optgroup label="Neural Intelligence (Cloud)">
                            <option value="local_fast">⚡ Kevryn AI (Fast)</option>
                            <option value="local_balanced">⚖️ Kevryn AI (Balanced)</option>
                            <option value="local_advanced">🧠 Kevryn AI (Advanced)</option>
                            <option value="local_expert">🛰️ Kevryn Neural Core (Expert)</option>
                        </optgroup>
                    </select>
                </div>
                <div className="ai-header-right">
                    <button onClick={fetchLocalModelsStatus} className="ai-header-btn" title="Refresh local status"><FaSpinner className={!localModels ? "spinning" : ""} size={12} /></button>
                    <button onClick={newChat} className="ai-header-btn" title="New Chat"><FaPlus size={12} /></button>
                    <button onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchSessions(); }} className={`ai-header-btn ${showHistory ? 'active' : ''}`} title="History"><FaHistory size={12} /></button>
                </div>
            </div>

            {showHistory && (
                <div className="ai-history-overlay">
                    <div className="ai-history-header">
                        <span>Chat History</span>
                        <FaTimes className="close-history" onClick={() => setShowHistory(false)} />
                    </div>
                    <div className="ai-history-list">
                        {sessions.length === 0 ? <div className="no-history">No past conversations</div> : 
                            sessions.map(s => (
                                <div key={s._id} className={`history-item ${currentSessionId === s._id ? 'active' : ''}`} onClick={() => loadSession(s._id)}>
                                    <div className="history-info">
                                        <div className="history-title">{s.title || 'New Chat'}</div>
                                    </div>
                                    <FaTrash className="delete-history" onClick={(e) => deleteSession(e, s._id)} />
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <div className="ai-messages">
                {messages.length === 0 && (
                    <div className="ai-welcome">
                        <div className="ai-welcome-icon"><FaMagic size={28} /></div>
                        <div className="ai-welcome-title">Kevryn Dev Agent</div>
                        <div className="ai-welcome-subtitle">Ask anything, I will magically build it.</div>
                        <div className="ai-welcome-hints">
                            <span className="ai-hint" onClick={() => executeAutonomousPlan('Build a complete Authentication React component.')}>"Build Auth UI"</span>
                            <span className="ai-hint" onClick={() => executeAutonomousPlan('Write a python snake game.')}>"Write Python Snake"</span>
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`ai-message ai-message-${msg.role}`}>
                        {msg.role === 'assistant' && <div className="ai-avatar"><FaRobot size={10} /></div>}
                        <div className={`ai-bubble ai-bubble-${msg.role}`}>
                            {msg.role === 'assistant' ? renderMessageContent(msg.content, i) : <span>{msg.content}</span>}
                        </div>
                    </div>
                ))}

                {/* Sub-Agent Telemetry Display */}
                {agentStatus && (
                    <div className="ai-message ai-message-assistant" style={{ opacity: 0.8 }}>
                        <div className="ai-avatar"><FaBolt size={10} color="#f59e0b" /></div>
                        <div className="ai-thinking" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaSpinner className="spinning" size={12} color="#f59e0b" />
                            <span style={{ fontSize: '12px', color: '#f59e0b', fontStyle: 'italic' }}>{agentStatus}</span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="ai-input-form">
                <div className="ai-input-wrapper" style={{ borderColor: '#8b5cf6' }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Instruct the autonomous agent..."
                        disabled={isLoading}
                        className="ai-input"
                    />
                    <button type="submit" disabled={!input.trim() || isLoading} className="ai-send-btn" style={{ color: '#8b5cf6' }}>
                        <FaPaperPlane size={12} />
                    </button>
                </div>
                <div className="ai-input-footer">
                    {modelSource === 'cloud_gemini' 
                        ? "Kevryn Core • Powered by Gemini 2.0 Flash 🚀" 
                        : "Kevryn Open AI • 24/7 High-Performance Cloud ☁️"}
                </div>
            </form>
        </div>
    );
};

export default AIPanel;
