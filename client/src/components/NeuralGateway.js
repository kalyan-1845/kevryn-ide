import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaKey, FaPlus, FaTrash, FaCopy, FaCheck, FaBrain, FaSatellite, FaTerminal } from 'react-icons/fa';

const _rawServerUrl = (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim();
const SERVER_URL = _rawServerUrl.startsWith('http') ? _rawServerUrl : `https://${_rawServerUrl}`;

const NeuralGateway = ({ token }) => {
    const [keys, setKeys] = useState([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    const api = axios.create({
        baseURL: SERVER_URL,
        headers: { Authorization: token }
    });

    const fetchKeys = async () => {
        try {
            const res = await api.get('/api/neural/keys');
            setKeys(res.data.keys);
        } catch (e) {
            console.error('Failed to fetch keys', e);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!newKeyName.trim()) return;
        setIsLoading(true);
        try {
            await api.post('/api/neural/keys/generate', { name: newKeyName });
            setNewKeyName('');
            fetchKeys();
        } catch (e) {
            alert('Failed to generate key');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (key) => {
        if (!window.confirm('Are you sure you want to revoke this API key?')) return;
        try {
            await api.delete(`/api/neural/keys/${key}`);
            fetchKeys();
        } catch (e) {
            alert('Failed to delete key');
        }
    };

    const copyToClipboard = (key) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="neural-gateway-panel">
            <div className="neural-header">
                <div className="neural-title">
                    <FaBrain className="pulsing-brain" />
                    <span>Neural Gateway</span>
                </div>
                <div className="neural-badge">Cloud Active</div>
            </div>

            <div className="neural-content">
                <div className="neural-hero">
                    <FaSatellite className="orbiting-sat" size={40} />
                    <h3>Independent Neural API</h3>
                    <p>Use your custom-trained brain in any project with these secure keys.</p>
                </div>

                <form className="key-gen-form" onSubmit={handleGenerate}>
                    <input 
                        type="text" 
                        placeholder="Project Name (e.g. My Mobile App)" 
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !newKeyName.trim()}>
                        <FaPlus /> Generate Key
                    </button>
                </form>

                <div className="keys-list">
                    {keys.length === 0 ? (
                        <div className="no-keys">No API keys generated yet.</div>
                    ) : (
                        keys.map((k) => (
                            <div key={k.key} className="key-card">
                                <div className="key-card-header">
                                    <span className="key-project-name">{k.name}</span>
                                    <span className="key-date">{new Date(k.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="key-value-row">
                                    <code className="key-code">{k.key}</code>
                                    <div className="key-actions">
                                        <button onClick={() => copyToClipboard(k.key)} title="Copy Key">
                                            {copiedKey === k.key ? <FaCheck color="#10b981" /> : <FaCopy />}
                                        </button>
                                        <button onClick={() => handleDelete(k.key)} title="Revoke Key" className="delete-btn">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <div className="key-usage">
                                    <FaTerminal size={10} />
                                    <span>{k.usage} Requests</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="neural-docs">
                    <h4>How to use your API:</h4>
                    <pre className="docs-code">
{`POST ${SERVER_URL}/api/neural/gateway/chat
{
  "key": "YOUR_KEY_HERE",
  "messages": [{"role": "user", "content": "Hello Brain!"}]
}`}
                    </pre>
                </div>
            </div>

            <style>{`
                .neural-gateway-panel {
                    padding: 20px;
                    color: #fff;
                    background: #0f172a;
                    height: 100%;
                    overflow-y: auto;
                    font-family: 'Inter', sans-serif;
                }
                .neural-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .neural-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 20px;
                    font-weight: 700;
                    background: linear-gradient(90deg, #8b5cf6, #ec4899);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .pulsing-brain {
                    color: #8b5cf6;
                    animation: pulse 2s infinite;
                    -webkit-text-fill-color: initial;
                }
                .neural-badge {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                .neural-hero {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: rgba(30, 41, 59, 0.5);
                    border-radius: 16px;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                }
                .orbiting-sat {
                    color: #8b5cf6;
                    margin-bottom: 20px;
                }
                .key-gen-form {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 30px;
                }
                .key-gen-form input {
                    flex: 1;
                    background: #1e293b;
                    border: 1px solid #334155;
                    padding: 12px 16px;
                    border-radius: 8px;
                    color: #fff;
                    outline: none;
                }
                .key-gen-form button {
                    background: #8b5cf6;
                    color: #fff;
                    border: none;
                    padding: 0 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .keys-list {
                    display: grid;
                    gap: 16px;
                }
                .key-card {
                    background: #1e293b;
                    padding: 16px;
                    border-radius: 12px;
                    border: 1px solid #334155;
                }
                .key-card-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    margin-bottom: 12px;
                }
                .key-project-name {
                    font-weight: 600;
                    color: #e2e8f0;
                }
                .key-date {
                    color: #64748b;
                }
                .key-value-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #0f172a;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                }
                .key-code {
                    flex: 1;
                    font-family: monospace;
                    color: #cbd5e1;
                    font-size: 13px;
                }
                .key-actions {
                    display: flex;
                    gap: 8px;
                }
                .key-actions button {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 4px;
                }
                .key-actions button:hover {
                    color: #fff;
                }
                .delete-btn:hover {
                    color: #ef4444 !important;
                }
                .key-usage {
                    font-size: 11px;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .neural-docs {
                    margin-top: 40px;
                    background: #000;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #1e293b;
                }
                .docs-code {
                    font-family: monospace;
                    font-size: 12px;
                    color: #10b981;
                    white-space: pre-wrap;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default NeuralGateway;
