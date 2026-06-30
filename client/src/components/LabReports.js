import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaClock, FaUsers, FaChartBar, FaTimes, FaFileCode } from 'react-icons/fa';


const LabReports = ({ token, serverUrl, onClose }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const api = axios.create({ baseURL: serverUrl || 'http://localhost:5000', headers: { Authorization: token } });
                const res = await api.get('/lab/sessions/past');
                setSessions(res.data.sessions || []);
            } catch (err) {
                console.error("Failed to load past sessions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, [serverUrl, token]);

    const handleViewReport = async (sessionId) => {
        setReportLoading(true);
        try {
            const api = axios.create({ baseURL: serverUrl || 'http://localhost:5000', headers: { Authorization: token } });
            const res = await api.get(`/lab/sessions/${sessionId}/report`);
            setSelectedReport(res.data);
        } catch (err) {
            alert("Failed to load report details.");
            console.error(err);
        } finally {
            setReportLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
            <div style={{ padding: '20px 40px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><FaChartBar color="#3b82f6" /> Lab Session Reports</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '10px' }}><FaTimes size={20} /></button>
            </div>

            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>Loading past sessions...</div>
                ) : selectedReport ? (
                    <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{selectedReport.session.sessionName}</h3>
                                <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '15px' }}>
                                    <span><FaCalendarAlt /> {new Date(selectedReport.session.startTime).toLocaleDateString()}</span>
                                    <span><FaClock /> {new Date(selectedReport.session.startTime).toLocaleTimeString()} - {new Date(selectedReport.session.endTime).toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} style={{ padding: '8px 16px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back to List</button>
                        </div>
                        
                        <div style={{ padding: '30px' }}>
                            <h4 style={{ color: '#cbd5e1', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Attended Students ({selectedReport.attendedStudents.length})</h4>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                                            <th style={{ padding: '12px' }}>Username</th>
                                            <th style={{ padding: '12px' }}>Active Time</th>
                                            <th style={{ padding: '12px' }}>Idle Time</th>
                                            <th style={{ padding: '12px' }}>Tab Switches</th>
                                            <th style={{ padding: '12px' }}>Files Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedReport.attendedStudents.map((student, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                <td style={{ padding: '12px', color: '#f8fafc' }}>{student.username}</td>
                                                <td style={{ padding: '12px', color: '#10b981' }}>{student.activeMinutes} min</td>
                                                <td style={{ padding: '12px', color: '#f59e0b' }}>{student.idleMinutes} min</td>
                                                <td style={{ padding: '12px', color: student.tabSwitches > 5 ? '#ef4444' : '#cbd5e1' }}>{student.tabSwitches}</td>
                                                <td style={{ padding: '12px', color: '#3b82f6' }}>{student.files.length}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <h4 style={{ color: '#cbd5e1', borderBottom: '1px solid #334155', paddingBottom: '10px', marginTop: '40px' }}>Absent / Offline ({selectedReport.offlineStudents.length})</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {selectedReport.offlineStudents.map((u, i) => (
                                    <div key={i} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px' }}>
                                        {u}
                                    </div>
                                ))}
                                {selectedReport.offlineStudents.length === 0 && <span style={{ color: '#64748b' }}>No students were absent!</span>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {sessions.length === 0 && <div style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center' }}>No past sessions found.</div>}
                        {sessions.map(s => (
                            <div key={s._id} style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc' }}>{s.sessionName}</h3>
                                <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>
                                    <FaCalendarAlt /> {new Date(s.startTime).toLocaleDateString()} <br/>
                                    <FaClock style={{ marginTop: '8px' }} /> {new Date(s.startTime).toLocaleTimeString()} - {new Date(s.endTime).toLocaleTimeString()}
                                </div>
                                <button onClick={() => handleViewReport(s._id)} disabled={reportLoading} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {reportLoading ? 'Loading...' : 'View Detailed Report'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabReports;
