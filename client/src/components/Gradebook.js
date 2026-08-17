import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { FaEye, FaTimes, FaCheckCircle, FaTimesCircle, FaSearch, FaChevronLeft, FaChevronRight, FaFilter, FaChartBar, FaFileAlt, FaExclamationTriangle, FaCheck, FaChartLine, FaClock } from 'react-icons/fa';

const Gradebook = ({ token, serverUrl }) => {
    const [cohorts, setCohorts] = useState([]);
    const [selectedCohortStr, setSelectedCohortStr] = useState('');
    const [viewType, setViewType] = useState('assignments'); // 'assignments' | 'aptitude'
    
    const [submissions, setSubmissions] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [viewingAptitudeReport, setViewingAptitudeReport] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });

    useEffect(() => {
        fetchCohorts();
    }, []);

    useEffect(() => {
        if (selectedCohortStr) {
            fetchSubmissions();
        } else {
            setSubmissions([]);
        }
    }, [selectedCohortStr, viewType]);

    useEffect(() => {
        let result = [...submissions];
        
        if (filterText) {
            result = result.filter(s => {
                const username = (s.studentUsername || s.username || '').toLowerCase();
                const title = (s.assignmentId?.title || s.testTitle || '').toLowerCase();
                return username.includes(filterText.toLowerCase()) || title.includes(filterText.toLowerCase());
            });
        }
        
        if (filterDate) {
            result = result.filter(s => {
                if (!s.submittedAt) return false;
                const d = new Date(s.submittedAt);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}` === filterDate;
            });
        }

        // Sort by score descending for ranking
        result.sort((a,b) => {
             const scoreA = a.score || a.totalScore || 0;
             const scoreB = b.score || b.totalScore || 0;
             return scoreB - scoreA;
        });

        setFilteredSubmissions(result);
    }, [submissions, filterText, filterDate]);

    const fetchCohorts = async () => {
        try {
            const res = await api.get('/api/timetable/my-schedule/faculty');
            const uniqueCohortsMap = new Map();
            res.data.forEach(item => {
                if (!item.department || !item.year || !item.section || !item.subjectName) return;
                const key = `${item.department}|${item.year}|${item.section}|${item.subjectName}`;
                if (!uniqueCohortsMap.has(key)) {
                    uniqueCohortsMap.set(key, {
                        department: item.department,
                        year: item.year,
                        section: item.section,
                        subjectName: item.subjectName,
                        str: key,
                        label: `${item.department} - Yr ${item.year} - Sec ${item.section} - ${item.subjectName}`
                    });
                }
            });
            const uniqueCohorts = Array.from(uniqueCohortsMap.values());
            setCohorts(uniqueCohorts);
            if (uniqueCohorts.length > 0) {
                setSelectedCohortStr(uniqueCohorts[0].str);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            if (!selectedCohortStr) {
                setIsLoading(false);
                return;
            }
            const [department, year, section, subjectName] = selectedCohortStr.split('|');
            const queryParams = `?department=${encodeURIComponent(department)}&year=${encodeURIComponent(year)}&section=${encodeURIComponent(section)}&subjectName=${encodeURIComponent(subjectName)}`;

            if (viewType === 'assignments') {
                const res = await api.get(`/api/assignments/cohort${queryParams}`);
                setSubmissions(res.data);
            } else {
                const res = await api.get(`/api/aptitude/cohort${queryParams}`);
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
            <style>
                {`
                    @media print {
                        body * { visibility: hidden; }
                        .print-area, .print-area * { visibility: visible; }
                        .print-area { position: absolute; left: 0; top: 0; width: 100%; background: #fff !important; color: #000 !important; padding: 20px; }
                        .print-hide { display: none !important; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; color: #000 !important; }
                        th { background: #f3f4f6 !important; }
                    }
                `}
            </style>
            <div className="print-area" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gradebook & Performance</h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>Holistic student assessment across labs and missions. {filteredSubmissions.length} submissions found.</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                placeholder="Search Student or Task..."
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                style={{ padding: '10px 12px 10px 35px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '200px', outline: 'none' }}
                            />
                        </div>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            style={{ padding: '10px 12px', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
                        />
                        <select
                            value={selectedCohortStr}
                            onChange={e => setSelectedCohortStr(e.target.value)}
                            style={{ padding: '10px', borderRadius: '10px', background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', outline: 'none', maxWidth: '350px' }}
                        >
                            {cohorts.map(c => <option key={c.str} value={c.str}>{c.label}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div onClick={() => setViewType('assignments')} style={tabStyle(viewType === 'assignments')}>Assignments</div>
                            <div onClick={() => setViewType('aptitude')} style={tabStyle(viewType === 'aptitude')}>Aptitude Missions</div>
                        </div>
                        <button
                            onClick={() => window.print()}
                            style={{ padding: '0 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                        >
                            <FaFileAlt /> Export PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="print-hide" style={{ display: 'none' }}>
                <h2 style={{color: '#000'}}>Kevryn Gradebook Report</h2>
                <p style={{color: '#000'}}>Date: {filterDate || 'All Time'} | Cohort: {cohorts.find(c => c.str === selectedCohortStr)?.label}</p>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', ...glassStyle, borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(15, 23, 42, 0.9)', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Rank</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Student</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{viewType === 'assignments' ? 'Lab Assignment' : 'Assessment Mission'}</th>
                                <th className="print-hide" style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Efficiency</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Score / Max</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Violations</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Time Spent</th>
                                <th style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Timestamp</th>
                                <th className="print-hide" style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#6366f1', fontWeight: 'bold' }}>Retrieving Performance Intel...</td></tr>
                            ) : filteredSubmissions.length === 0 ? (
                                <tr><td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found for this sector.</td></tr>
                            ) : (
                                filteredSubmissions.map((s, index) => {
                                    const percentage = Math.round((s.score || s.totalScore || 0) / (s.maxScore || 1) * 100);
                                    
                                    // Calculate time spent formatting
                                    const seconds = s.timeSpentSeconds || 0;
                                    const mins = Math.floor(seconds / 60);
                                    const timeStr = mins > 0 ? `${mins}m ${seconds % 60}s` : seconds > 0 ? `${seconds}s` : 'N/A';

                                    return (
                                        <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '16px 20px', fontWeight: '900', color: '#cbd5e1' }}>#{index + 1}</td>
                                            <td style={{ padding: '16px 20px', fontWeight: '700', color: '#f1f5f9' }}>{s.studentUsername || s.username}</td>
                                            <td style={{ padding: '16px 20px', color: '#94a3b8' }}>{s.assignmentId?.title || s.testTitle || 'N/A'}</td>
                                            <td className="print-hide" style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', minWidth: '60px' }}>
                                                        <div style={{ width: `${percentage}%`, height: '100%', background: percentage > 70 ? '#10b981' : percentage > 40 ? '#f59e0b' : '#ef4444', transition: 'width 1s ease' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: '900', color: percentage > 70 ? '#10b981' : percentage > 40 ? '#f59e0b' : '#ef4444' }}>{percentage}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', fontWeight: '900', color: '#f1f5f9' }}>{s.score || s.totalScore} <span style={{ color: '#64748b', fontSize: '12px' }}>/ {s.maxScore}</span></td>
                                            
                                            <td style={{ padding: '16px 20px' }}>
                                                {((s.tabSwitches || 0) > 0 || (s.pasteViolations || 0) > 0 || (s.fullScreenExits || 0) > 0) ? (
                                                    <span style={{ color: '#f87171', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FaExclamationTriangle /> {(s.tabSwitches || 0) + (s.pasteViolations || 0) + (s.fullScreenExits || 0)}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '800' }}><FaCheck /> CLEAN</span>
                                                )}
                                            </td>

                                            <td style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}><FaClock size={10} style={{marginRight: '4px'}}/>{timeStr}</td>
                                            <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '12px' }}>{new Date(s.submittedAt).toLocaleString()}</td>
                                            <td className="print-hide" style={{ padding: '16px 20px' }}>
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
