import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { 
    FaPlay, FaPaperPlane, FaArrowLeft, FaCheckCircle, FaTimesCircle, 
    FaBook, FaCode, FaRobot, FaRocket, FaExclamationTriangle, 
    FaTerminal, FaChalkboardTeacher, FaClipboardList, FaGraduationCap,
    FaBolt, FaHistory, FaTrophy, FaCalendarAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const StudentAssignmentView = ({ 
    token, serverUrl, userId, onBack, 
    activeSessionId, onEnterLab, 
    activeAptitudeSession, onEnterAptitude 
}) => {
    // viewMode: 'hub' | 'courses' | 'assignments' | 'solve' | 'aptitude-list'
    const [viewMode, setViewMode] = useState('hub');
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [activeAssignments, setActiveAssignments] = useState([]);
    const [aptitudeHistory, setAptitudeHistory] = useState([]);
    const [userStats, setUserStats] = useState({ completed: 0, points: 0, rank: 'Novice' });

    // Solver & Test States
    const [code, setCode] = useState('');
    const [studentLanguage, setStudentLanguage] = useState('python'); // Default if 'any'
    const [testResults, setTestResults] = useState(null);
    const [submissionStatus, setSubmissionStatus] = useState(null);

    const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });

    useEffect(() => {
        fetchEnrolledCourses();
        fetchAptitudeHistory();
        fetchActiveAssignments();
        // Mock stats or fetch from backend if available
        setUserStats({ completed: 12, points: 450, rank: 'Pro Code-Warrior' });
    }, []);

    const fetchActiveAssignments = async () => {
        try {
            const res = await api.get('/api/assignments/student/active');
            setActiveAssignments(res.data);
        } catch (e) { console.error("Failed to fetch active assignments", e); }
    };

    const fetchEnrolledCourses = async () => {
        try {
            const res = await api.get('/api/student/enrolled-courses');
            setCourses(res.data);
        } catch (e) { console.error("Failed to fetch courses", e); }
    };

    const fetchAptitudeHistory = async () => {
        try {
            // New endpoint for student to see their test history
            const res = await api.get('/api/aptitude/student/history');
            setAptitudeHistory(res.data);
        } catch (e) { console.error("Failed to fetch aptitude history", e); }
    };

    const handleCourseClick = async (course) => {
        setSelectedCourse(course);
        setViewMode('assignments');
        try {
            const [assignRes, userRes] = await Promise.all([
                api.get(`/api/assignments/course/${course._id}`),
                api.get('/auth/user')
            ]);
            setAssignments(assignRes.data.map(a => ({ ...a, courseName: course.name })));
            const subRes = await api.get(`/api/assignments/course/${course._id}/student/${userRes.data.username}`);
            setSubmissions(subRes.data);
        } catch (e) { console.error(e); }
    };

    const openAssignment = (assignment) => {
        setSelectedAssignment(assignment);
        setCode(assignment.starterCode || '');
        setTestResults(null);
        setSubmissionStatus(null);
        setViewMode('solve');
    };

    const handleBack = () => {
        if (viewMode === 'solve') setViewMode('assignments');
        else if (viewMode === 'assignments') { setViewMode('courses'); setSelectedCourse(null); }
        else if (viewMode === 'courses' || viewMode === 'aptitude-list') setViewMode('hub');
        else onBack();
    };

    const runTests = async () => {
        setSubmissionStatus('Running Tests...');
        try {
            const res = await api.post(`/api/assignments/${selectedAssignment._id}/run-tests`, {
                code, language: selectedAssignment.language === 'any' ? studentLanguage : selectedAssignment.language
            });
            setTestResults(res.data.results);
            setSubmissionStatus('Tests Completed');
        } catch (e) { setSubmissionStatus('Error: ' + e.message); }
    };

    const submitAssignment = async () => {
        if (!window.confirm("Are you sure you want to submit?")) return;
        setSubmissionStatus('Submitting...');
        try {
            const res = await api.post(`/api/assignments/${selectedAssignment._id}/submit`, {
                code, language: selectedAssignment.language === 'any' ? studentLanguage : selectedAssignment.language
            });
            setTestResults(res.data.results);
            const { score, maxScore } = res.data.submission;
            setSubmissionStatus(`Submitted Successfully! Marks: ${score}/${maxScore}`);
        } catch (e) { setSubmissionStatus('Submission Error: ' + e.message); }
    };

    // --- STYLES ---
    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
    };

    const containerStyle = {
        padding: '60px 40px',
        color: '#f8fafc',
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: '100%',
        position: 'relative',
        zIndex: 10,
        fontFamily: "'Outfit', sans-serif"
    };

    const rootStyle = {
        height: '100%',
        width: '100%',
        background: '#050505', // Solid background to obscure particles
        overflowY: 'auto',
        position: 'relative',
        scrollBehavior: 'smooth'
    };

    const watermarkStyle = {
        position: 'fixed',
        bottom: '-5%',
        right: '-5%',
        fontSize: '25vw',
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.02)',
        pointerEvents: 'none',
        zIndex: 1,
        fontFamily: "'Outfit', sans-serif",
        letterSpacing: '-1vw',
        lineHeight: 1,
        userSelect: 'none'
    };

    // --- HUB SECTION RENDER ---
    const renderHub = () => (
        <div style={rootStyle}>
            {/* Watermark */}
            <div style={watermarkStyle}>KEVRYN</div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={containerStyle}>
                {/* Header / Hero */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
                    <div>
                        <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 12px 0', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1.5px' }}>
                            Student Command Center
                        </h1>
                        <p style={{ fontSize: '18px', color: '#94a3b8', margin: 0 }}>Welcome back, Operator. Stay sharp, your missions await.</p>
                    </div>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '14px 28px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)',
                            background: 'rgba(139, 92, 246, 0.05)', color: '#a78bfa', cursor: 'pointer',
                            fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px',
                            transition: 'all 0.2s', boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'}}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'}}
                    >
                        <FaCode /> OPEN PERSONAL WORKSPACE
                    </button>
                </div>

                {/* Mission Control (Active) */}
                {(activeAptitudeSession || activeSessionId) && (
                    <div style={{ marginBottom: '60px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <FaBolt color="#fbbf24" size={16} />
                            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Mission Control: Active Now</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                            {activeAptitudeSession && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(161, 98, 7, 0.05))',
                                        border: '1px solid rgba(234, 179, 8, 0.4)', padding: '32px', borderRadius: '24px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        boxShadow: '0 10px 40px -10px rgba(234, 179, 8, 0.1)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ width: '56px', height: '56px', background: 'rgba(234,179,8,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}><FaExclamationTriangle size={28} /></div>
                                        <div>
                                            <div style={{ color: '#eab308', fontSize: '12px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>STRICT EXAM ACTIVE</div>
                                            <h3 style={{ margin: '4px 0', fontSize: '22px', fontWeight: '800' }}>{activeAptitudeSession.title}</h3>
                                        </div>
                                    </div>
                                    <button onClick={onEnterAptitude} style={{ padding: '12px 24px', background: '#eab308', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>ENGAGE MISSION</button>
                                </motion.div>
                            )}
                            {activeSessionId && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(91, 33, 182, 0.05))',
                                        border: '1px solid rgba(124, 58, 237, 0.4)', padding: '32px', borderRadius: '24px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        boxShadow: '0 10px 40px -10px rgba(124, 58, 237, 0.1)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ width: '56px', height: '56px', background: 'rgba(124,58,237,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}><FaTerminal size={28} /></div>
                                        <div>
                                            <div style={{ color: '#a78bfa', fontSize: '12px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>LIVE LAB ACTIVE</div>
                                            <h3 style={{ margin: '4px 0', fontSize: '22px', fontWeight: '800' }}>Monitored Playground</h3>
                                        </div>
                                    </div>
                                    <button onClick={onEnterLab} style={{ padding: '12px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>JOIN SQUAD</button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}

                {/* Upcoming Missions */}
                <div style={{ marginBottom: '60px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <FaCalendarAlt color="#60a5fa" size={16} />
                        <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Target Tracking: Upcoming Missions</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '20px' }}>
                        {activeAssignments.length === 0 ? (
                            <div style={{ minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'default' }}>
                                No Upcoming Missions. Stay Tuned...
                            </div>
                        ) : (
                            activeAssignments.map(a => {
                                const daysLeft = Math.ceil((new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                                const urgencyLabel = daysLeft < 0 ? 'OVERDUE' : (daysLeft === 0 ? 'DUE TODAY' : `T-MINUS ${daysLeft} DAYS`);
                                const urgencyColor = daysLeft < 0 ? '#ef4444' : (daysLeft <= 2 ? '#f59e0b' : '#64748b');

                                return (
                                    <div key={a._id} style={{ minWidth: '300px', ...cardStyle, background: 'rgba(255,255,255,0.01)', border: `1px dashed rgba(255,255,255,0.1)` }}>
                                        <div style={{ color: urgencyColor, fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>{urgencyLabel}</div>
                                        <h4 style={{ margin: 0, fontSize: '18px' }}>{a.title}</h4>
                                        <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>{a.courseId?.name || 'Unknown Course'}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Core Navigation Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                    <HubCard 
                        title="Aptitude Center" 
                        desc="Take standardized tests, mock exams, and view your detailed performance analytics."
                        icon={<FaTrophy size={24} />}
                        color="#eab308"
                        onClick={() => setViewMode('aptitude-list')}
                        count={activeAptitudeSession ? 1 : 0}
                    />
                    <HubCard 
                        title="Assignment Depot" 
                        desc="Complete your coding missions, handle edge cases, and deploy your best solutions."
                        icon={<FaClipboardList size={24} />}
                        color="#3b82f6"
                        onClick={() => setViewMode('courses')}
                        count={activeAssignments.length}
                    />
                    <HubCard 
                        title="Academy Vault" 
                        desc="Access your enrolled courses, lecture materials, and semester-wise documentation."
                        icon={<FaGraduationCap size={24} />}
                        color="#8b5cf6"
                        onClick={() => setViewMode('courses')}
                        count={courses.length}
                    />
                    <HubCard 
                        title="Mission History" 
                        desc="Review your past submissions, feedback from faculty, and grade progressions."
                        icon={<FaHistory size={24} />}
                        color="#10b981"
                        onClick={() => { alert("History module coming soon!"); }}
                    />
                </div>
            </motion.div>
        </div>
    );

    // --- SUB-COMPONENTS ---
    const HubCard = ({ title, desc, icon, color, onClick, count }) => (
        <motion.div
            whileHover={{ y: -8, border: `1px solid ${color}44`, boxShadow: `0 20px 40px -20px ${color}22` }}
            onClick={onClick}
            style={cardStyle}
        >
            <div style={{ width: '56px', height: '56px', background: `${color}11`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, marginBottom: '24px' }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: '#fff' }}>{title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' }}>{desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: color, display: 'flex', alignItems: 'center', gap: '8px' }}>EXPLORE <FaArrowLeft style={{ transform: 'rotate(180deg)', fontSize: '10px' }} /></span>
                {count !== undefined && (
                    <span style={{ background: `${color}22`, color: color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>{count} ACTIVE</span>
                )}
            </div>
        </motion.div>
    );

    // --- RENDER APTITUDE LIST ---
    const renderAptitudeList = () => (
        <div style={rootStyle}>
            <div style={watermarkStyle}>TESTS</div>
            <div style={containerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={handleBack} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer' }}><FaArrowLeft /></motion.button>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Aptitude Test Center</h2>
                </div>

                {activeAptitudeSession && (
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Active Examination</h3>
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            style={{ ...cardStyle, border: '1px solid rgba(234, 179, 8, 0.4)', background: 'rgba(234, 179, 8, 0.05)' }}
                            onClick={onEnterAptitude}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{ color: '#eab308' }}><FaRocket size={32} /></div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '20px' }}>{activeAptitudeSession.title}</h4>
                                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>Strict Environment • {activeAptitudeSession.duration} Minutes</p>
                                    </div>
                                </div>
                                <button style={{ padding: '10px 20px', background: '#eab308', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>START NOW</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Test History & Results</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {aptitudeHistory.length === 0 ? (
                        <div style={{ color: '#64748b', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No past test records found.</div>
                    ) : (
                        aptitudeHistory.map(test => (
                            <div key={test._id} style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>COMPLETED</span>
                                    <span style={{ color: '#64748b', fontSize: '11px' }}>{new Date(test.startTime).toLocaleDateString()}</span>
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{test.title}</h4>
                                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Score: {test.submission?.score || 'N/A'}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    // --- RENDER LOGIC ---
    if (viewMode === 'hub') return renderHub();
    if (viewMode === 'aptitude-list') return renderAptitudeList();

    // RENDER SOLVER
    if (viewMode === 'solve' && selectedAssignment) {
        return (
            <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: '#020617', color: '#e2e8f0', fontFamily: "'Outfit', sans-serif" }}>
                <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleBack} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaArrowLeft /></motion.button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <span style={{ padding: '2px 8px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '12px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>MISSION</span>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{selectedAssignment.title}</h3>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#475569' }}>{selectedAssignment.courseName} • </span>
                                {selectedAssignment.language === 'any' ? (
                                    <select 
                                        value={studentLanguage} 
                                        onChange={e => setStudentLanguage(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', outline: 'none' }}
                                    >
                                        <option value="python">PYTHON</option>
                                        <option value="javascript">JAVASCRIPT</option>
                                        <option value="c">C</option>
                                        <option value="cpp">C++</option>
                                        <option value="java">JAVA</option>
                                    </select>
                                ) : (
                                    <span style={{ fontSize: '12px', color: '#475569' }}>{selectedAssignment.language.toUpperCase()} ENGINE</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <motion.button onClick={runTests} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.5)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}><FaPlay size={12} color="#60a5fa" /> EXECUTE LOGIC</motion.button>
                        <motion.button onClick={submitAssignment} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}><FaPaperPlane size={12} /> DEPLOY SOLUTION</motion.button>
                    </div>
                </div>
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div style={{ width: '400px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.2)', backdropFilter: 'blur(5px)' }}>
                        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}><FaBook color="#6366f1" size={14} /><h4 style={{ color: '#fff', margin: 0, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Objective Briefing</h4></div>
                            <div style={{ lineHeight: '1.8', color: '#94a3b8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>{selectedAssignment.description}</div>
                        </div>
                        <div style={{ height: '45%', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(2, 6, 23, 0.5)', padding: '20px' }}>
                            {submissionStatus && <div style={{ marginBottom: '10px', color: '#818cf8', fontWeight: '600' }}>{submissionStatus}</div>}
                            {testResults && testResults.map((res, i) => (
                                <div key={i} style={{ marginBottom: '8px', padding: '10px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: `1px solid ${res.pass ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                                    {res.pass ? '✅' : '❌'} {res.testCase}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}><Editor height="100%" theme="vs-dark" defaultValue={code} onChange={v => setCode(v)} language={selectedAssignment.language === 'any' ? studentLanguage : selectedAssignment.language} options={{ fontSize: 16, fontFamily: 'JetBrains Mono', minimap: { enabled: false } }} /></div>
                </div>
            </div>
        );
    }

    // RENDER ASSIGNMENTS LIST
    if (viewMode === 'assignments') {
        return (
            <div style={rootStyle}>
                <div style={watermarkStyle}>TASKS</div>
                <div style={containerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={handleBack} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer' }}><FaArrowLeft /></motion.button>
                        <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>{selectedCourse?.name} Missions</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                        {assignments.map(a => {
                            const submission = submissions.find(s => s.assignmentId?._id === a._id);
                        return (
                            <motion.div key={a._id} onClick={() => openAssignment(a)} whileHover={{ y: -5 }} style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Assignment</span>
                                    {submission && <span style={{ padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', fontSize: '10px', fontWeight: '800' }}>SUBMITTED</span>}
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{a.title}</h3>
                                <div style={{ color: '#94a3b8', fontSize: '13px' }}><FaCode size={10} /> {a.language} • {submission ? 'Achieved Score' : 'Target Score'}: {submission ? `${submission.score} / ${submission.maxScore}` : `${a.maxPoints || 100} Marks`}</div>
                            </motion.div>
                        );})}
                    </div>
                </div>
            </div>
        );
    }

    // RENDER COURSE LIST
    return (
        <div style={rootStyle}>
            <div style={watermarkStyle}>ACADEMY</div>
            <div style={containerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={handleBack} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer' }}><FaArrowLeft /></motion.button>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Academy Vault (Courses)</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {courses.map(course => (
                        <motion.div key={course._id} onClick={() => handleCourseClick(course)} whileHover={{ y: -5 }} style={cardStyle}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}></div>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>{course.name}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>{course.code} • Sem {course.semester}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentAssignmentView;
