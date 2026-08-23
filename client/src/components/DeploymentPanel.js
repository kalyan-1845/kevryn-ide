import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { FaPlay, FaStop, FaGlobe, FaMobileAlt, FaTrash, FaCopy, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';

const _raw = (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim();
const SERVER_URL = _raw.startsWith('http') ? _raw : `https://${_raw}`;

const DeploymentPanel = ({ token, activeMode }) => {
    // === Local LAN State ===
    const [localFrontendRunning, setLocalFrontendRunning] = useState(false);
    const [localBackendRunning, setLocalBackendRunning] = useState(false);
    const [localIp, setLocalIp] = useState('');
    const [frontendPort] = useState(3000);
    const [backendPort] = useState(5000);
    const [localFrontendLoading, setLocalFrontendLoading] = useState(false);
    const [localBackendLoading, setLocalBackendLoading] = useState(false);

    // === Worldwide Deploy State ===
    const [worldDeployed, setWorldDeployed] = useState(false);
    const [worldUrl, setWorldUrl] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState('');
    const [copied, setCopied] = useState(false);
    const [projectName, setProjectName] = useState('');

    const api = axios.create({
        baseURL: SERVER_URL,
        headers: { Authorization: token }
    });

    // Detect local IP on mount
    useEffect(() => {
        try {
            const rtc = new RTCPeerConnection({ iceServers: [] });
            rtc.createDataChannel('');
            rtc.createOffer().then(offer => rtc.setLocalDescription(offer));
            rtc.onicecandidate = (event) => {
                if (event && event.candidate && event.candidate.candidate) {
                    const parts = event.candidate.candidate.split(' ');
                    const ipMatch = parts.find(p => /^(\d{1,3}\.){3}\d{1,3}$/.test(p));
                    if (ipMatch && ipMatch !== '0.0.0.0') {
                        setLocalIp(ipMatch);
                        rtc.close();
                    }
                }
            };
            // Fallback if WebRTC doesn't resolve
            setTimeout(() => {
                if (!localIp) setLocalIp('192.168.1.X');
            }, 3000);
        } catch {
            setLocalIp('192.168.1.X');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Check existing deploy status on mount
    useEffect(() => {
        if (!token) return;
        api.get('/deploy/status').then(res => {
            if (res.data.frontend) {
                setWorldDeployed(true);
                if (res.data.siteName) setProjectName(res.data.siteName);
                const host = window.__KEVRYN_DESKTOP__ ? 'https://kevryn-ide.pages.dev' : window.location.origin;
                const fullUrl = res.data.frontend.startsWith('http')
                    ? res.data.frontend
                    : host + res.data.frontend;
                setWorldUrl(fullUrl);
            }
            if (res.data.backend) {
                setLocalBackendRunning(true);
            }
        }).catch(() => {});
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // === Local LAN Handlers ===
    const toggleLocalFrontend = async () => {
        if (localFrontendRunning) {
            setLocalFrontendRunning(false);
        } else {
            setLocalFrontendLoading(true);
            try {
                // If running in Desktop .exe, use Electron IPC to start a local dev server
                if (window.electronAPI && window.electronAPI.spawnTerminal) {
                    await window.electronAPI.terminalWrite('npx serve . -l ' + frontendPort + ' --no-clipboard\r');
                }
                setLocalFrontendRunning(true);
            } catch (err) {
                console.error('Failed to start local frontend:', err);
            } finally {
                setLocalFrontendLoading(false);
            }
        }
    };

    const toggleLocalBackend = async () => {
        if (localBackendRunning) {
            try {
                await api.post('/deploy/stop');
            } catch {}
            setLocalBackendRunning(false);
        } else {
            setLocalBackendLoading(true);
            try {
                const res = await api.post('/deploy/backend', {
                    entryFile: 'server.js'
                });
                if (res.data.port) {
                    setLocalBackendRunning(true);
                }
            } catch (err) {
                console.error('Failed to start local backend:', err);
            } finally {
                setLocalBackendLoading(false);
            }
        }
    };

    // === Worldwide Deploy Handlers ===
    const publishToWorld = async () => {
        setIsPublishing(true);
        setPublishError('');
        
        // Auto-generate a friendly name if they leave it blank
        const finalSiteName = projectName.trim() || 'portfolio-' + Math.random().toString(36).substring(2, 8);

        try {
            const res = await api.post('/deploy/frontend', {
                siteName: finalSiteName,
                backendUrl: ''
            });
            if (res.data.url) {
                const host = window.__KEVRYN_DESKTOP__ ? 'https://kevryn-ide.pages.dev' : window.location.origin;
                const fullUrl = res.data.url.startsWith('http')
                    ? res.data.url
                    : host + res.data.url;
                setWorldUrl(fullUrl);
                setWorldDeployed(true);
            }
        } catch (err) {
            const errMsg = err.response?.data?.error || err.message || 'Deployment failed';
            setPublishError(errMsg);
        } finally {
            setIsPublishing(false);
        }
    };

    const unpublishWorld = async () => {
        if (!window.confirm('Are you sure you want to unpublish? This will take your project offline instantly.')) return;
        try {
            await api.post('/deploy/unpublish');
            setWorldDeployed(false);
            setWorldUrl('');
        } catch {
            // Even if the route doesn't exist yet, clear the UI
            setWorldDeployed(false);
            setWorldUrl('');
        }
    };

    const lanUrl = 'http://' + localIp + ':' + frontendPort;

    // === Render: Local LAN Testing ===
    const renderLocalLAN = () => (
        <div style={{ display: 'flex', height: '100%', padding: '20px', gap: '20px' }}>
            {/* Left: Controls */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid var(--border-color, #333)', paddingRight: '20px' }}>
                <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                        <FaMobileAlt /> Local LAN Testing
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888', lineHeight: '1.5' }}>
                        Test across multiple devices on the same Wi-Fi. Uses your local RAM only — zero server cost.
                    </p>
                </div>

                {/* Frontend Server Card */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.25)', padding: '15px', borderRadius: '10px',
                    border: localFrontendRunning ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Frontend Server</div>
                        <div style={{ fontSize: '12px', color: localFrontendRunning ? '#10b981' : '#666' }}>
                            {localFrontendLoading ? 'Starting...' : localFrontendRunning ? 'Running on Port ' + frontendPort : 'Stopped'}
                        </div>
                    </div>
                    <button
                        onClick={toggleLocalFrontend}
                        disabled={localFrontendLoading}
                        style={{
                            background: localFrontendRunning ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: localFrontendRunning ? '#ef4444' : '#10b981',
                            border: '1px solid ' + (localFrontendRunning ? '#ef4444' : '#10b981'),
                            padding: '8px 18px', borderRadius: '6px',
                            cursor: localFrontendLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '13px', transition: 'all 0.2s ease',
                            opacity: localFrontendLoading ? 0.6 : 1
                        }}
                    >
                        {localFrontendLoading ? <FaSpinner className="spin" size={11} /> : localFrontendRunning ? <><FaStop size={11} /> Stop</> : <><FaPlay size={11} /> Run</>}
                    </button>
                </div>

                {/* Backend Server Card */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.25)', padding: '15px', borderRadius: '10px',
                    border: localBackendRunning ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Backend Server</div>
                        <div style={{ fontSize: '12px', color: localBackendRunning ? '#3b82f6' : '#666' }}>
                            {localBackendLoading ? 'Starting...' : localBackendRunning ? 'Running on Port ' + backendPort : 'Stopped'}
                        </div>
                    </div>
                    <button
                        onClick={toggleLocalBackend}
                        disabled={localBackendLoading}
                        style={{
                            background: localBackendRunning ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: localBackendRunning ? '#ef4444' : '#3b82f6',
                            border: '1px solid ' + (localBackendRunning ? '#ef4444' : '#3b82f6'),
                            padding: '8px 18px', borderRadius: '6px',
                            cursor: localBackendLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '13px', transition: 'all 0.2s ease',
                            opacity: localBackendLoading ? 0.6 : 1
                        }}
                    >
                        {localBackendLoading ? <FaSpinner className="spin" size={11} /> : localBackendRunning ? <><FaStop size={11} /> Stop</> : <><FaPlay size={11} /> Run</>}
                    </button>
                </div>
            </div>

            {/* Right: QR Code Preview */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {(localFrontendRunning || localBackendRunning) ? (
                    <>
                        <div style={{
                            background: 'white', padding: '16px', borderRadius: '12px',
                            marginBottom: '15px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                        }}>
                            <QRCodeSVG value={lanUrl} size={140} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                            Scan with your Phone / Tablet to preview
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'rgba(0,0,0,0.3)', padding: '10px 16px',
                            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                            <span style={{ fontFamily: 'monospace', color: '#61dafb', fontSize: '14px' }}>{lanUrl}</span>
                            <FaCopy
                                style={{ cursor: 'pointer', color: copied ? '#10b981' : '#888', transition: 'color 0.2s' }}
                                onClick={() => copyToClipboard(lanUrl)}
                                title="Copy Link"
                            />
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '12px', textAlign: 'center', maxWidth: '250px' }}>
                            All devices must be connected to the same Wi-Fi network. Closes automatically when you exit the IDE.
                        </div>
                    </>
                ) : (
                    <div style={{ color: '#555', textAlign: 'center' }}>
                        <FaMobileAlt size={45} style={{ opacity: 0.15, marginBottom: '15px' }} />
                        <p style={{ margin: 0, fontSize: '13px' }}>Start a server to generate the Live LAN Preview</p>
                    </div>
                )}
            </div>

            <style>{`
                .spin { animation: spin-anim 0.8s linear infinite; }
                @keyframes spin-anim { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    // === Render: Worldwide Static Deploy ===
    const renderWorldDeploy = () => (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', padding: '30px', textAlign: 'center'
        }}>
            <FaGlobe size={42} style={{ color: '#3b82f6', marginBottom: '15px', opacity: 0.9 }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>Deploy to World</h3>
            <p style={{
                maxWidth: '420px', fontSize: '13px', color: '#888',
                lineHeight: '1.6', marginBottom: '25px'
            }}>
                Publish your portfolio, resume, or static website to a public URL visible worldwide.
                <br />
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Restriction:</span> Static projects only (HTML / CSS / JS). No backends or databases.
            </p>

            {publishError && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                    padding: '10px 20px', borderRadius: '8px', marginBottom: '15px',
                    fontSize: '13px', maxWidth: '400px', border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    {publishError}
                </div>
            )}

            {!worldDeployed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ color: '#888', fontSize: '13px', paddingLeft: '10px' }}>kevryn-ide.pages.dev/sites/</span>
                        <input
                            type="text"
                            placeholder="e.g. my-resume (or leave blank to auto-generate)"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value.replace(/[^a-z0-9-_]/gi, '').toLowerCase())}
                            style={{
                                background: 'transparent', border: 'none', color: '#61dafb',
                                fontSize: '14px', outline: 'none', padding: '8px', width: '300px'
                            }}
                            title="Leave blank to auto-generate a portfolio name"
                        />
                    </div>
                    <button
                    onClick={publishToWorld}
                    disabled={isPublishing}
                    style={{
                        background: isPublishing
                            ? 'linear-gradient(135deg, #555, #444)'
                            : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        color: 'white', border: 'none',
                        padding: '14px 35px', borderRadius: '10px',
                        fontSize: '15px', fontWeight: 'bold',
                        cursor: isPublishing ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        boxShadow: isPublishing ? 'none' : '0 6px 20px rgba(59, 130, 246, 0.35)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {isPublishing ? (
                        <>
                            <FaSpinner className="spin" size={14} />
                            Publishing...
                        </>
                    ) : (
                        '\uD83D\uDE80 Publish to Web'
                    )}
                </button>
                </div>
            ) : (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                    background: 'rgba(59, 130, 246, 0.05)', padding: '25px 30px',
                    borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.15)',
                    maxWidth: '500px', width: '100%'
                }}>
                    <div style={{
                        fontSize: '13px', color: '#10b981', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        <span style={{ fontSize: '16px' }}>{'\u2713'}</span> Successfully Published & Live
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: 'rgba(0,0,0,0.3)', padding: '12px 20px',
                        borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
                        width: '100%', justifyContent: 'center'
                    }}>
                        <a
                            href={worldUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                fontFamily: 'monospace', color: '#61dafb',
                                textDecoration: 'none', fontSize: '14px',
                                wordBreak: 'break-all', display: 'flex',
                                alignItems: 'center', gap: '6px'
                            }}
                        >
                            <FaExternalLinkAlt size={10} /> {worldUrl}
                        </a>
                        <FaCopy
                            style={{ cursor: 'pointer', color: copied ? '#10b981' : '#888', flexShrink: 0, transition: 'color 0.2s' }}
                            onClick={() => copyToClipboard(worldUrl)}
                            title="Copy Link"
                        />
                    </div>

                    <button
                        onClick={unpublishWorld}
                        style={{
                            background: 'transparent', color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            padding: '8px 22px', borderRadius: '8px',
                            fontSize: '13px', fontWeight: 'bold',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '8px', marginTop: '5px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <FaTrash size={11} /> Unpublish / Take Down
                    </button>
                </div>
            )}

            <style>{`
                .spin { animation: spin-anim 0.8s linear infinite; }
                @keyframes spin-anim { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    return (
        <div style={{
            height: '100%', background: 'var(--bg-primary, #1a1a2e)',
            color: 'var(--text-primary, #e0e0e0)',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{
                padding: '10px 20px', borderBottom: '1px solid var(--border-color, #333)',
                background: 'var(--bg-secondary, #16213e)',
                fontWeight: 'bold', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                {activeMode === 'local'
                    ? <><FaMobileAlt color="#a78bfa" /> Local LAN Test Environment</>
                    : <><FaGlobe color="#3b82f6" /> Worldwide Static Deployment</>
                }
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
                {activeMode === 'local' ? renderLocalLAN() : renderWorldDeploy()}
            </div>
        </div>
    );
};

export default DeploymentPanel;
