import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { FaEye, FaTimes, FaCheckCircle, FaTimesCircle, FaSearch, FaChevronLeft, FaChevronRight, FaFilter, FaChartBar, FaFileAlt, FaExclamationTriangle, FaCheck, FaChartLine } from 'react-icons/fa';

const Gradebook = ({ token, serverUrl }) => {
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('all');
    const [viewType, setViewType] = useState('assignments'); // 'assignments' | 'aptitude'
    
    const [submissions, setSubmissions] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [viewingAptitudeReport, setViewingAptitudeReport] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourseId) {
            const course = courses.find(c => c._id === selectedCourseId);
            if (course) {
                setBatches(course.batches || []);
                setSelectedBatchId('all');
            }
            fetchSubmissions();
        } else {
            setSubmissions([]);
            setBatches([]);
        }
    }, [selectedCourseId, viewType, selectedBatchId]);

    useEffect(() => {
        if (filterText) {
            setFilteredSubmissions(submissions.filter(s => {
                const username = (s.studentUsername || s.username || '').toLowerCase();
                const title = (s.assignmentId?.title || s.testTitle || '').toLowerCase();
                return username.includes(filterText.toLowerCase()) || title.includes(filterText.toLowerCase());
            }));
        } else {
            setFilteredSubmissions(submissions);
        }
    }, [submissions, filterText]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/api/courses');
            setCourses(res.data);
            if (res.data.length > 0) setSelectedCourseId(res.data[0]._id);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            if (viewType === 'assignments') {
                const res = await api.get(`/api/assignments/course/${selectedCourseId}/submissions${selectedBatchId !== 'all' ? `?batchId=${selectedBatchId}` : ''}`);
                setSubmissions(res.data);
            } else {
                const res = await api.get(`/api/aptitude/course/${selectedCourseId}/submissions${selectedBatchId !== 'all' ? `?batchId=${selectedBatchId}` : ''}`);
                setSubmissions(res.data.submissions || []);
            }
        } catch (e) {
            console.error(e);
            setSubmissions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const glassStyle = {
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
    };

    const tabStyle = (active) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        color: active ? '#818cf8' : '#94a3b8',
        borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
        transition: 'all 0.3s ease',
        background: active ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
    });

    return (
        <div style={{ padding: '30px', color: '#e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', background: '#020617' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gradebook & Performance</h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>Holistic student assessment across labs and missions</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                placeholder="Search Student or Task..."
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                style={{ padding: '10px 12px 10px 35px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '250px', outline: 'none' }}
                            />
                        </div>
                        <select
                            value={selectedCourseId}
                            onChange={e => setSelectedCourseId(e.target.value)}
                            style={{ padding: '10px', borderRadius: '10px', background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', outline: 'none' }}
                        >
                            {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                        </select>
                        <select
                            value={selectedBatchId}
                            onChange={e => setSelectedBatchId(e.target.value)}
                            style={{ padding: '10px', borderRadius: '10px', background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', outline: 'none', minWidth: '120px' }}
                        >
                            <option value="all">All Batches</option>
                            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div onClick={() => setViewType('assignments')} style={tabStyle(viewType === 'assignments')}>Assignments</div>
                        <div onClick={() => setViewType('aptitude')} style={tabStyle(viewType === 'aptitude')}>Aptitude Missions</div>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', ...glassStyle, borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(15, 23, 42, 0.9)', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Student</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{viewType === 'assignments' ? 'Lab Assignment' : 'Assessment Mission'}</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Efficiency</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Score / Max</th>
                                {viewType === 'aptitude' && <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Violations</th>}
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Timestamp</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6366f1', fontWeight: 'bold' }}>Retrieving Performance Intel...</td></tr>
                            ) : filteredSubmissions.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found for this sector.</td></tr>
                            ) : (
                                filteredSubmissions.map(s => {
                                    const percentage = Math.round((s.score || s.totalScore || 0) / (s.maxScore || 1) * 100);
                                    return (
                                        <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '16px 20px', fontWeight: '700', color: '#f1f5f9' }}>{s.studentUsername || s.username}</td>
                                            <td style={{ padding: '16px 20px', color: '#94a3b8' }}>{s.assignmentId?.title || s.testTitle || 'N/A'}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', minWidth: '60px' }}>
                                                        <div style={{ width: `${percentage}%`, height: '100%', background: percentage > 70 ? '#10b981' : percentage > 40 ? '#f59e0b' : '#ef4444', transition: 'width 1s ease' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: '900', color: percentage > 70 ? '#10b981' : percentage > 40 ? '#f59e0b' : '#ef4444' }}>{percentage}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', fontWeight: '900', color: '#f1f5f9' }}>{s.score || s.totalScore} <span style={{ color: '#64748b', fontSize: '12px' }}>/ {s.maxScore}</span></td>
                                            {viewType === 'aptitude' && (
                                                <td style={{ padding: '16px 20px' }}>
                                                    {(s.tabSwitches > 0 || s.pasteViolations > 0) ? (
                                                        <span style={{ color: '#f87171', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <FaExclamationTriangle /> {s.tabSwitches + s.pasteViolations}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '800' }}><FaCheck /> CLEAN</span>
                                                    )}
                                                </td>
                                            )}
                                            <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px' }}>{new Date(s.submittedAt).toLocaleString()}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <button
                                                    onClick={() => viewType === 'assignments' ? setSelectedSubmission(s) : setViewingAptitudeReport(s)}
                                                    style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    {viewType === 'assignments' ? <><FaEye /> SOURCE</> : <><FaFileAlt /> REPORT</>}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Code Modal (Assignments) */}
            {selectedSubmission && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#0f172a', width: '1000px', height: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>{selectedSubmission.assignmentId?.title}</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Student: <b>{selectedSubmission.studentUsername}</b> • Score: {selectedSubmission.score}/{selectedSubmission.maxScore}</p>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%' }}>&times;</button>
                        </div>

                        <div style={{ flex: 1, display: 'flex' }}>
                            <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                <Editor
                                    height="100%"
                                    defaultLanguage="python"
                                    theme="vs-dark"
                                    value={selectedSubmission.submittedCode}
                                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
                                />
                            </div>
                            <div style={{ width: '320px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: '900', fontSize: '13px', color: '#6366f1' }}>EXECUTION METRICS</div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                                    {selectedSubmission.testResults?.map((r, i) => (
                                        <div key={i} style={{ marginBottom: '12px', padding: '15px', borderRadius: '12px', background: r.pass ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${r.pass ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: '800', fontSize: '12px', color: r.pass ? '#10b981' : '#f87171' }}>TC #{i + 1}</span>
                                                {r.pass ? <FaCheckCircle color="#10b981" /> : <FaTimesCircle color="#f87171" />}
                                            </div>
                                            {!r.pass && (
                                                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                                    <div style={{ color: '#f87171', marginBottom: '4px' }}>Error: {r.error || 'Assertion Failed'}</div>
                                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>ACTUAL: {r.actualOutput || 'Empty'}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Aptitude Detailed Report Modal */}
            {viewingAptitudeReport && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#0f172a', width: '900px', height: '80vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>Mission Brief: {viewingAptitudeReport.testTitle}</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Student: <b>{viewingAptitudeReport.username}</b></p>
                            </div>
                            <button onClick={() => setViewingAptitudeReport(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%' }}>&times;</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                            {/* Stats Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                                <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(129, 140, 248, 0.05)', border: '1px solid rgba(129, 140, 248, 0.1)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>Accuracy</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900' }}>{Math.round((viewingAptitudeReport.totalScore / (viewingAptitudeReport.maxScore || 1)) * 100)}%</div>
                                </div>
                                <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>XP Earned</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900' }}>{viewingAptitudeReport.totalScore}</div>
                                </div>
                                <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.1)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#f87171', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>Tab Switches</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900' }}>{viewingAptitudeReport.tabSwitches || 0}</div>
                                </div>
                                <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>Paste Attempts</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900' }}>{viewingAptitudeReport.pasteViolations || 0}</div>
                                </div>
                            </div>

                            {/* Detailed Answers */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {viewingAptitudeReport.questions?.map((q, idx) => {
                                    const subAns = viewingAptitudeReport.answers?.find(a => a.questionId === q._id);
                                    return (
                                        <div key={q._id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '900', color: '#818cf8' }}>Q{idx + 1} • {q.type?.toUpperCase()}</span>
                                                <span style={{ fontSize: '12px', fontWeight: '900', color: subAns?.isCorrect ? '#10b981' : '#f87171' }}>{subAns?.pointsEarned || 0} / {q.points || 0} XP</span>
                                            </div>
                                            <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: '#f1f5f9' }}>{q.text}</div>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div style={{ padding: '12px 15px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '5px' }}>STUDENT CHOICE:</div>
                                                    <div style={{ fontSize: '13px', color: subAns?.isCorrect ? '#10b981' : '#f1f5f9' }}>{subAns?.providedAnswers?.join(', ') || 'N/A'}</div>
                                                </div>
                                                {!subAns?.isCorrect && (
                                                    <div style={{ padding: '12px 15px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                                        <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', marginBottom: '5px' }}>CORRECT SEQUENCE:</div>
                                                        <div style={{ fontSize: '13px', color: '#10b981' }}>{q.correctAnswers?.join(', ')}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gradebook;
