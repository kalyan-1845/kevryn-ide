import React, { useState, useEffect } from 'react';
import {
    FaChalkboardTeacher, FaCode, FaChartLine, FaSignOutAlt, FaBookOpen,
    FaUserGraduate, FaClipboardList, FaDesktop, FaTachometerAlt,
    FaBell, FaShieldAlt, FaEye, FaTasks, FaTrophy, FaCalendarAlt
} from 'react-icons/fa';
import MonitorDashboard from './MonitorDashboard';
import CourseManager from './CourseManager';
import AssignmentManager from './AssignmentManager';
import AptitudeManager from './AptitudeManager';
import Gradebook from './Gradebook';
import StudentReports from './StudentReports';
import LabReports from './LabReports';
import CodingArena from './CodingArena';
import TimetableWidget from './TimetableWidget'; // NEW: Timetable
import axios from 'axios';

// Fallback local constants
const _raw = (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim();
const SERVER_FALLBACK = _raw.startsWith('http') ? _raw : `https://${_raw}`;

const LiveClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return <span>{time.toLocaleTimeString()}</span>;
};

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', margin = '0' }) => (
    <div style={{
        width, height, borderRadius, margin,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear'
    }} />
);

const FacultyHub = ({ token, SERVER_URL: serverUrl, userId, onLogout }) => {
    const [activeView, setActiveView] = useState(localStorage.getItem('facultyActiveView') || 'dashboard');
    const [stats, setStats] = useState({ courses: 0, students: 0, activeSessions: 0, scheduledLabs: 0 });
    const [facultyName, setFacultyName] = useState('Faculty');
    const [collegeName, setCollegeName] = useState(localStorage.getItem('collegeName') || null);
    const [isLoading, setIsLoading] = useState(true);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        localStorage.setItem('facultyActiveView', activeView);
    }, [activeView]);

    // The 1s timer for 'time' state is removed from here as per instruction.
    // The 'time' state will now only update on component mount or other re-renders,
    // which is sufficient for greeting and dashboard date display.

    const refreshStats = async () => {
        if (!token) return;
        setIsLoading(true);
        const api = axios.create({ baseURL: serverUrl || SERVER_FALLBACK, headers: { Authorization: token } });
        try {
            const [courseRes, sessionRes, timetableRes] = await Promise.all([
                api.get('/api/courses'),
                api.get('/lab/active-session'),
                api.get('/api/timetable/my-schedule/faculty')
            ]);
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todaysLabs = (timetableRes.data || []).filter(s => s.dayOfWeek === today).length;
            setStats({
                courses: courseRes.data.length,
                students: 0, // Mock student count for now or fetch if available
                activeSessions: sessionRes.data.session ? 1 : 0,
                scheduledLabs: todaysLabs
            });
        } catch (e) {
            console.error("Stats Fetch Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshStats();
        // Try to get faculty info from token
        try {
            const payload = JSON.parse(atob(token.replace('Bearer ', '').split('.')[1]));
            if (payload.username) setFacultyName(payload.username);
            
            // Fetch college info if not in localStorage
            if (!localStorage.getItem('collegeName')) {
                const api = axios.create({ baseURL: serverUrl || SERVER_FALLBACK, headers: { Authorization: token } });
                api.get('/api/college/my').then(res => {
                    if (res.data.college) {
                        setCollegeName(res.data.college.name);
                        localStorage.setItem('collegeName', res.data.college.name);
                    }
                });
            }
        } catch (e) { }
    }, [token, serverUrl]);

    const greeting = () => {
        const h = time.getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#060b17', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

            {/* === SIDEBAR === */}
            <div style={{
                width: '240px', minWidth: '240px', display: 'flex', flexDirection: 'column',
                background: 'linear-gradient(180deg, #0d1526 0%, #0a1020 100%)',
                borderRight: '1px solid rgba(99,102,241,0.2)',
                boxShadow: '4px 0 30px rgba(0,0,0,0.5)'
            }}>
                {/* Logo */}
                <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <img src="/logo.png?v=4" alt="KevRyn Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.6))' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.3px' }}>KevRyn</div>
                            <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Faculty Command</div>
                        </div>
                    </div>
                </div>

                {/* Faculty Info */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '700', color: '#fff',
                            flexShrink: 0
                        }}>
                            {facultyName[0]?.toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{facultyName}</div>
                            {collegeName ? (
                                <div style={{ fontSize: '9px', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {collegeName.substring(0, 20)}{collegeName.length > 20 ? '...' : ''}
                                </div>
                            ) : (
                                <div style={{ fontSize: '10px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '5px', height: '5px', background: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>
                                    Online
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
                    <NavSection label="Overview">
                        <NavItem icon={<FaTachometerAlt />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                    </NavSection>
                    <NavSection label="Management">
                        <NavItem icon={<FaBookOpen />} label="My Courses" isActive={activeView === 'courses'} onClick={() => setActiveView('courses')} />
                        <NavItem icon={<FaClipboardList />} label="Assignments" isActive={activeView === 'assignments'} onClick={() => setActiveView('assignments')} />
                        <NavItem icon={<FaTasks />} label="Aptitude Tests" isActive={activeView === 'aptitude'} onClick={() => setActiveView('aptitude')} />
                        <NavItem icon={<FaUserGraduate />} label="Gradebook" isActive={activeView === 'analytics'} onClick={() => setActiveView('analytics')} />
                        <NavItem icon={<FaTrophy />} label="Coding Arena" isActive={activeView === 'arena'} onClick={() => setActiveView('arena')} />
                    </NavSection>
                    <NavSection label="Lab Control">
                        <NavItem icon={<FaEye />} label="Live Monitor" isActive={activeView === 'active-labs'} onClick={() => setActiveView('active-labs')} badge={stats.activeSessions > 0 ? 'LIVE' : null} />
                        <NavItem icon={<FaTasks />} label="Session Reports" isActive={activeView === 'lab-reports'} onClick={() => setActiveView('lab-reports')} />
                        <NavItem icon={<FaChartLine />} label="General Reports" isActive={activeView === 'reports'} onClick={() => setActiveView('reports')} />
                    </NavSection>
                </nav>

                {/* Bottom */}
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '11px', color: '#475569', textAlign: 'center', marginBottom: '10px' }}>
                        <LiveClock />
                    </div>
                    <button onClick={onLogout} style={{
                        width: '100%', padding: '9px', background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                        borderRadius: '8px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '8px',
                        fontSize: '13px', fontWeight: '600', transition: 'all 0.2s'
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    >
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>

            {/* === MAIN CONTENT === */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {activeView === 'dashboard' && (
                    isLoading ? (
                        <div style={{ padding: '40px' }}>
                            <Skeleton width="200px" height="30px" margin="0 0 20px 0" />
                            <Skeleton height="150px" borderRadius="16px" margin="0 0 40px 0" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <Skeleton height="100px" borderRadius="16px" />
                                <Skeleton height="100px" borderRadius="16px" />
                            </div>
                        </div>
                    ) : (
                        <FacultyDashboardHome
                            greeting={greeting()}
                            facultyName={facultyName}
                            stats={stats}
                            time={time}
                            onNavigate={setActiveView}
                            serverUrl={serverUrl}
                        />
                    )
                )}
                {activeView === 'courses' && <CourseManager token={token} serverUrl={serverUrl} userId={userId} />}
                {activeView === 'assignments' && <AssignmentManager token={token} serverUrl={serverUrl} userId={userId} />}
                {activeView === 'aptitude' && <AptitudeManager token={token} serverUrl={serverUrl} userId={userId} />}
                {activeView === 'active-labs' && <MonitorDashboard token={token} serverUrl={serverUrl} userId={userId} onLogout={onLogout} isEmbedded={true} onSessionChange={refreshStats} />}
                {activeView === 'analytics' && <Gradebook token={token} serverUrl={serverUrl} />}
                {activeView === 'arena' && <CodingArena />}
                {activeView === 'lab-reports' && <LabReports token={token} serverUrl={serverUrl} onClose={() => setActiveView('dashboard')} />}
                {activeView === 'reports' && <StudentReports token={token} serverUrl={serverUrl} />}
            </div>
        </div>
    );
};

/* ── Sub-components ── */

const NavSection = ({ label, children }) => (
    <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px', paddingLeft: '8px' }}>{label}</div>
        {children}
    </div>
);

const NavItem = ({ icon, label, isActive, onClick, badge }) => (
    <div onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
        borderRadius: '8px', cursor: 'pointer', marginBottom: '2px',
        background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))' : 'transparent',
        border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
        color: isActive ? '#a5b4fc' : '#64748b',
        fontWeight: isActive ? '600' : '400',
        transition: 'all 0.15s',
        position: 'relative'
    }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
        <span style={{ fontSize: '13px' }}>{icon}</span>
        <span style={{ fontSize: '13px', flex: 1 }}>{label}</span>
        {badge && (
            <span style={{
                fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '8px',
                background: badge === 'LIVE' ? '#ef4444' : '#6366f1', color: '#fff', letterSpacing: '0.5px',
                animation: badge === 'LIVE' ? 'pulse 2s infinite' : 'none'
            }}>{badge}</span>
        )}
    </div>
);

const FacultyDashboardHome = ({ greeting, facultyName, stats, time, onNavigate, serverUrl }) => {
    const quickActions = [
        { label: 'Start Live Lab', icon: <FaDesktop />, view: 'active-labs', color: '#818cf8', gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)', desc: 'Monitor students in real-time', glow: 'rgba(99, 102, 241, 0.4)' },
        { label: 'My Courses', icon: <FaBookOpen />, view: 'courses', color: '#60a5fa', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', desc: 'Manage your course roster', glow: 'rgba(59, 130, 246, 0.4)' },
        { label: 'Assignments', icon: <FaClipboardList />, view: 'assignments', color: '#fbbf24', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', desc: 'Create & review assignments', glow: 'rgba(245, 158, 11, 0.4)' },
        { label: 'Student Reports', icon: <FaChartLine />, view: 'reports', color: '#34d399', gradient: 'linear-gradient(135deg, #059669, #10b981)', desc: 'View lab activity reports', glow: 'rgba(16, 185, 129, 0.4)' },
    ];

    const statCards = [
        { label: 'Scheduled Labs Today', value: stats.scheduledLabs || 0, icon: <FaCalendarAlt />, color: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
        { label: 'Live Sessions', value: stats.activeSessions, icon: <FaDesktop />, color: stats.activeSessions > 0 ? '#f87171' : '#94a3b8', bg: stats.activeSessions > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)', pulse: stats.activeSessions > 0 },
        { label: 'Today', value: time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), icon: <FaChartLine />, color: '#818cf8', bg: 'rgba(99, 102, 241, 0.1)' },
    ];

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', background: '#020617', position: 'relative' }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

            <style>{\
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
                @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .glass-card { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .glass-card:hover { border: 1px solid rgba(255, 255, 255, 0.2); transform: translateY(-4px); box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5); }
                .quick-action-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; overflow: hidden; }
                .quick-action-card:hover { transform: translateY(-6px); background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.15); }
                .gradient-text { background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            \}</style>

            {/* Premium Header */}
            <div style={{ marginBottom: '40px', animation: 'fadeUp 0.6s ease-out' }}>
                <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', fontSize: '12px', color: '#818cf8', fontWeight: '700', marginBottom: '16px', letterSpacing: '0.5px' }}>
                    {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <h1 style={{ fontSize: '42px', fontWeight: '900', margin: '0 0 12px 0', color: '#f8fafc', letterSpacing: '-1.5px', lineHeight: '1.2' }}>
                    Welcome back, <span className="gradient-text">{facultyName}</span> 👋
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0, fontWeight: '500', maxWidth: '600px' }}>
                    Your command center is online. Monitor labs, manage assignments, and track student performance in real-time.
                </p>
            </div>

            {/* Smart Schedule Widget */}
            <div style={{ animation: 'fadeUp 0.6s ease-out 0.1s both', marginBottom: '40px' }}>
                <div style={{ padding: '2px', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.1), rgba(255,255,255,0.02))', borderRadius: '22px' }}>
                    <div style={{ background: '#0f172a', borderRadius: '20px', padding: '24px' }}>
                        <TimetableWidget token={localStorage.getItem('token')} serverUrl={serverUrl} onLabStarted={() => onNavigate('active-labs')} />
                    </div>
                </div>
            </div>

            {/* Premium Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px', animation: 'fadeUp 0.6s ease-out 0.2s both' }}>
                {statCards.map((s, i) => (
                    <div key={i} className="glass-card" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: \adial-gradient(circle, \20, transparent 70%)\, borderRadius: '50%' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '24px', border: \1px solid \30\ }}>
                                {s.icon}
                            </div>
                            {s.pulse && (
                                <div style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '20px', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse-glow 2s infinite' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} /> LIVE NOW
                                </div>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: '36px', fontWeight: '900', color: '#f8fafc', lineHeight: 1.1, marginBottom: '8px' }}>{s.value}</div>
                            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions (Floating Glass Cards) */}
            <div style={{ animation: 'fadeUp 0.6s ease-out 0.3s both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '4px', height: '16px', background: '#818cf8', borderRadius: '2px' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>Command Modules</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    {quickActions.map((a, i) => (
                        <div key={i} className="quick-action-card" onClick={() => onNavigate(a.view)} style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '18px',
                                    background: a.gradient, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '24px', color: '#fff',
                                    boxShadow: \  10px 25px \\, flexShrink: 0
                                }}>
                                    {a.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>{a.label}</div>
                                    <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.4' }}>{a.desc}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feature Highlights - Premium Data Grid */}
            <div style={{ marginTop: '48px', animation: 'fadeUp 0.6s ease-out 0.4s both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '4px', height: '16px', background: '#34d399', borderRadius: '2px' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>Platform Capabilities</h3>
                </div>
                <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                        {[
                            { icon: '👁️', label: 'Real-time Telemetry', desc: 'Monitor every keystroke and screen instantly' },
                            { icon: '🛡️', label: 'Security Enforcement', desc: 'Automated tab tracking & paste detection' },
                            { icon: '🧠', label: 'AI Integrity Scoring', desc: 'Behavioral analysis for academic honesty' },
                            { icon: '⚡', label: 'Live IDE Sandbox', desc: 'Secure cloud environments for coding' },
                            { icon: '📡', label: 'Global Broadcast', desc: 'Send alerts directly to student workspaces' },
                            { icon: '📊', label: 'Automated Grading', desc: 'Run test cases and generate score reports' },
                        ].map((f, i) => (
                            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '24px', width: '48px', height: '48px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {f.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>{f.label}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{f.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default FacultyHub;
