import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaClock, FaChartBar, FaTimes, FaDownload, FaPrint, FaExclamationTriangle, FaCheckCircle, FaUserCheck, FaUserTimes, FaShieldAlt } from 'react-icons/fa';

const LabReports = ({ token, serverUrl, onClose, preSelectedCohort }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [viewFilesModal, setViewFilesModal] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const api = axios.create({ baseURL: serverUrl || 'http://localhost:5000', headers: { Authorization: token } });
                const res = await api.get('/lab/sessions/past');
                let allSessions = res.data.sessions || [];
                if (preSelectedCohort && preSelectedCohort.subjectName) {
                    allSessions = allSessions.filter(s => s.subject === preSelectedCohort.subjectName);
                }
                setSessions(allSessions);
            } catch (err) {
                console.error("Failed to load past sessions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, [serverUrl, token]);

    const fetchReportData = async (sessionId) => {
        const api = axios.create({ baseURL: serverUrl || 'http://localhost:5000', headers: { Authorization: token } });
        const res = await api.get(`/lab/sessions/${sessionId}/report`);
        return res.data;
    };

    const handleViewReport = async (sessionId) => {
        setReportLoading(true);
        try {
            const data = await fetchReportData(sessionId);
            setSelectedReport(data);
        } catch (err) {
            alert("Failed to load report details.");
            console.error(err);
        } finally {
            setReportLoading(false);
        }
    };

    // --- CSV EXPORT FUNCTION ---
    const exportCSV = (reportData) => {
        const { session, attendedStudents, offlineStudents } = reportData;
        const sessionDate = new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const startTime = new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const endTime = new Date(session.endTime || new Date()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        let csv = `ACE ENGINEERING COLLEGE - DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\n`;
        csv += `LAB SESSION PERFORMANCE & INTEGRITY AUDIT REPORT\n`;
        csv += `Session Name:,${session.sessionName}\n`;
        csv += `Course/Subject:,${session.courseId?.name || 'N/A'}\n`;
        csv += `Date:,${sessionDate}\n`;
        csv += `Timing:,${startTime} - ${endTime}\n`;
        csv += `Total Enrolled:,${(attendedStudents.length + offlineStudents.length)}\n`;
        csv += `Present:,${attendedStudents.length}\n`;
        csv += `Absent:,${offlineStudents.length}\n\n`;

        csv += `S.No,Roll Number,Student Name,Username,Active Time (Min),Idle Time (Min),Focus Score (%),Tab Switches,Violations & Malpractice Flags,Files Created,Attendance Status\n`;

        attendedStudents.forEach((st, idx) => {
            const roll = `"${st.rollNo || st.username}"`;
            const name = `"${st.fullName || st.username}"`;
            const user = `"${st.username}"`;
            const viol = `"${st.violations || 'None'}"`;
            const status = `"${st.status || 'Attended'}"`;
            csv += `${idx + 1},${roll},${name},${user},${st.activeMinutes},${st.idleMinutes},${st.focusScore}%,${st.tabSwitches},${viol},${st.files?.length || 0},${status}\n`;
        });

        offlineStudents.forEach((st, idx) => {
            const roll = `"${typeof st === 'object' ? (st.rollNo || st.username) : st}"`;
            const name = `"${typeof st === 'object' ? (st.fullName || st.username) : st}"`;
            const user = `"${typeof st === 'object' ? st.username : st}"`;
            csv += `${attendedStudents.length + idx + 1},${roll},${name},${user},0,0,0%,0,"Absent / No Login",0,"ABSENT"\n`;
        });

        csv += `\n\nVerified By Faculty-in-Charge: ____________________\t\tApproved By HOD: ____________________\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lab_Report_${session.sessionName.replace(/\s+/g, '_')}_${sessionDate.replace(/\//g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadCardCSV = async (sessionId) => {
        setDownloadingId(sessionId);
        try {
            const data = await fetchReportData(sessionId);
            exportCSV(data);
        } catch (err) {
            alert("Failed to download CSV report.");
        } finally {
            setDownloadingId(null);
        }
    };

    // --- PRINT / PDF EXPORT FUNCTION ---
    const handlePrintPDF = (reportData) => {
        const { session, attendedStudents, offlineStudents } = reportData;
        const printWindow = window.open('', '_blank');
        const sessionDate = new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const startTime = new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const endTime = new Date(session.endTime || new Date()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lab Report - ${session.sessionName}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #0f172a; font-size: 13px; line-height: 1.4; }
                    .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
                    .header h2 { margin: 0; color: #1e3a8a; font-size: 20px; text-transform: uppercase; }
                    .header h3 { margin: 4px 0 0 0; color: #0284c7; font-size: 14px; font-weight: 600; }
                    .header p { margin: 4px 0 0 0; color: #64748b; font-size: 11px; }
                    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 12px; }
                    .meta-item strong { display: block; color: #475569; font-size: 10px; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                    th { background-color: #0f172a; color: #ffffff; font-weight: 600; text-transform: uppercase; font-size: 10px; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .badge-clean { color: #16a34a; font-weight: bold; }
                    .badge-warn { color: #ca8a04; font-weight: bold; }
                    .badge-danger { color: #dc2626; font-weight: bold; }
                    .footer-sign { margin-top: 50px; display: flex; justify-content: space-between; font-weight: 600; font-size: 12px; }
                    @media print {
                        body { padding: 0; }
                        @page { margin: 15mm; }
                    }
                </style>
            </head>
            <body>
                <div style="text-align:center; padding-bottom: 5px; margin-bottom: 10px;">
                    <img src="${window.location.origin}/ace_logo.svg" alt="ACE Logo" style="height: 60px; object-fit: contain;" />
                </div>
                <div class="header">
                    <h2>ACE ENGINEERING COLLEGE</h2>
                    <h3>DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</h3>
                    <p>OFFICIAL LAB SESSION PERFORMANCE & INTEGRITY AUDIT REPORT</p>
                </div>

                <div class="meta-grid">
                    <div class="meta-item"><strong>Session Name</strong>${session.sessionName}</div>
                    <div class="meta-item"><strong>Course / Subject</strong>${session.courseId?.name || 'Computer Science Lab'}</div>
                    <div class="meta-item"><strong>Date</strong>${sessionDate}</div>
                    <div class="meta-item"><strong>Session Time</strong>${startTime} - ${endTime}</div>
                    <div class="meta-item"><strong>Total Enrolled</strong>${attendedStudents.length + offlineStudents.length}</div>
                    <div class="meta-item"><strong>Students Attended</strong><span style="color: #16a34a;">${attendedStudents.length}</span></div>
                    <div class="meta-item"><strong>Students Absent</strong><span style="color: #dc2626;">${offlineStudents.length}</span></div>
                    <div class="meta-item"><strong>Audit Result</strong><span style="color: #0284c7;">VERIFIED BY SYSTEM</span></div>
                </div>

                <h4 style="margin: 20px 0 5px 0; color: #1e293b;">ATTENDED STUDENT PERFORMANCE & INTEGRITY ROSTER</h4>
                <table>
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Roll Number</th>
                            <th>Student Name</th>
                            <th>Active Time</th>
                            <th>Idle Time</th>
                            <th>Focus Score</th>
                            <th>Tab Switches</th>
                            <th>Malpractice / Integrity Status</th>
                            <th>Code Files</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attendedStudents.map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td><strong>${s.rollNo || s.username}</strong></td>
                                <td>${s.fullName || s.username}</td>
                                <td>${s.activeMinutes} min</td>
                                <td>${s.idleMinutes} min</td>
                                <td><strong style="color: ${s.focusScore >= 80 ? '#16a34a' : s.focusScore >= 60 ? '#ca8a04' : '#dc2626'}">${s.focusScore}%</strong></td>
                                <td>${s.tabSwitches}</td>
                                <td class="${s.tabSwitches > 5 ? 'badge-danger' : s.tabSwitches > 2 ? 'badge-warn' : 'badge-clean'}">${s.violations || 'Clean Session'}</td>
                                <td>${s.files?.length || 0}</td>
                                <td>${s.status || 'Attended'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                ${offlineStudents.length > 0 ? `
                    <h4 style="margin: 25px 0 5px 0; color: #dc2626;">ABSENTEE LIST (${offlineStudents.length} Students)</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Roll Number</th>
                                <th>Student Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${offlineStudents.map((s, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><strong>${typeof s === 'object' ? (s.rollNo || s.username) : s}</strong></td>
                                    <td>${typeof s === 'object' ? (s.fullName || s.username) : s}</td>
                                    <td style="color: #dc2626; font-weight: bold;">ABSENT</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <div class="footer-sign">
                    <div>
                        <p>____________________________________</p>
                        <p>Faculty-in-Charge Signature</p>
                    </div>
                    <div>
                        <p>____________________________________</p>
                        <p>Head of Department (HOD) Approval</p>
                    </div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', color: '#f8fafc', backdropFilter: 'blur(10px)' }}>
            {/* Header Bar */}
            <div style={{ padding: '18px 40px', borderBottom: '1px solid #1e293b', background: '#090d16', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px' }}>
                    <FaChartBar color="#3b82f6" /> Lab Session Reports & Attendance Audits
                </h2>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaTimes size={16} /> Close
                </button>
            </div>

            <div style={{ flex: 1, padding: '30px 40px', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '50px 0' }}>Loading past lab sessions...</div>
                ) : selectedReport ? (
                    /* Detailed Report View */
                    <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '24px 30px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', color: '#f8fafc' }}>{selectedReport.session.sessionName}</h3>
                                <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <span><FaCalendarAlt color="#3b82f6" /> {new Date(selectedReport.session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                                    <span><FaClock color="#06b6d4" /> {new Date(selectedReport.session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} - {new Date(selectedReport.session.endTime || new Date()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                                    <span><FaShieldAlt color="#10b981" /> Course: {selectedReport.session.courseId?.name || 'General Computer Science'}</span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => exportCSV(selectedReport)} style={{ padding: '9px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaDownload /> Download CSV (Excel)
                                </button>
                                <button onClick={() => handlePrintPDF(selectedReport)} style={{ padding: '9px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaPrint /> Print Official PDF
                                </button>
                                <button onClick={() => setSelectedReport(null)} style={{ padding: '9px 16px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                                    Back to List
                                </button>
                            </div>
                        </div>

                        {/* Summary Stats Cards */}
                        <div style={{ padding: '24px 30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', background: '#090d16', borderBottom: '1px solid #1e293b' }}>
                            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Attended Students</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>{selectedReport.attendedStudents.length}</div>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Absent Students</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>{selectedReport.offlineStudents.length}</div>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Avg Focus Score</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                                    {selectedReport.attendedStudents.length > 0
                                        ? Math.round(selectedReport.attendedStudents.reduce((acc, s) => acc + (s.focusScore || 0), 0) / selectedReport.attendedStudents.length)
                                        : 0}%
                                </div>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Flagged Violations</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
                                    {selectedReport.attendedStudents.filter(s => s.tabSwitches > 5).length}
                                </div>
                            </div>
                        </div>

                        {/* Attended Students Table */}
                        <div style={{ padding: '30px' }}>
                            <h4 style={{ color: '#cbd5e1', margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaUserCheck color="#10b981" /> Attended Student Roster ({selectedReport.attendedStudents.length})
                            </h4>
                            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #1e293b' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                            <th style={{ padding: '12px 16px' }}>Student Roll No</th>
                                            <th style={{ padding: '12px 16px' }}>Full Name</th>
                                            <th style={{ padding: '12px 16px' }}>Active Time</th>
                                            <th style={{ padding: '12px 16px' }}>Idle Time</th>
                                            <th style={{ padding: '12px 16px' }}>Focus Score</th>
                                            <th style={{ padding: '12px 16px' }}>Tab Switches</th>
                                            <th style={{ padding: '12px 16px' }}>Violations / Integrity Flags</th>
                                            <th style={{ padding: '12px 16px' }}>Files</th>
                                            <th style={{ padding: '12px 16px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedReport.attendedStudents.map((st, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#38bdf8' }}>{st.rollNo || st.username}</td>
                                                <td style={{ padding: '12px 16px', color: '#f8fafc' }}>{st.fullName || st.username}</td>
                                                <td style={{ padding: '12px 16px', color: '#10b981' }}>{st.activeMinutes} min</td>
                                                <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{st.idleMinutes} min</td>
                                                <td style={{ padding: '12px 16px', fontWeight: 'bold', color: st.focusScore >= 80 ? '#10b981' : st.focusScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                                                    {st.focusScore}%
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: st.tabSwitches > 5 ? 'rgba(239,68,68,0.2)' : st.tabSwitches > 2 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)', color: st.tabSwitches > 5 ? '#ef4444' : st.tabSwitches > 2 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                                                        {st.tabSwitches}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: st.tabSwitches > 5 ? '#ef4444' : st.tabSwitches > 2 ? '#f59e0b' : '#94a3b8' }}>
                                                    {st.violations || 'Clean Session'}
                                                </td>
                                                <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 'bold' }}>
                                                    {st.files?.length || 0}
                                                    {st.files?.length > 0 && (
                                                        <button onClick={() => setViewFilesModal(st)} style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '11px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View</button>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: st.tabSwitches > 5 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: st.tabSwitches > 5 ? '#ef4444' : '#10b981' }}>
                                                        {st.status || 'Attended'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Offline / Absent Students */}
                            <h4 style={{ color: '#ef4444', margin: '35px 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaUserTimes color="#ef4444" /> Absent Students ({selectedReport.offlineStudents.length})
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {selectedReport.offlineStudents.map((st, i) => (
                                    <div key={i} style={{ padding: '8px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <strong>{typeof st === 'object' ? (st.rollNo || st.username) : st}</strong>
                                        <span style={{ color: '#94a3b8' }}>({typeof st === 'object' ? (st.fullName || st.username) : st})</span>
                                    </div>
                                ))}
                                {selectedReport.offlineStudents.length === 0 && <span style={{ color: '#64748b' }}>No absent students! 100% Attendance recorded.</span>}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Sessions Grid View */
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                        {sessions.length === 0 && <div style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>No past lab sessions found.</div>}
                        {sessions.map(s => (
                            <div key={s._id} style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '18px' }}>{s.sessionName}</h3>
                                    <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div><FaCalendarAlt color="#3b82f6" /> {new Date(s.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                                        <div><FaClock color="#06b6d4" /> {new Date(s.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} - {new Date(s.endTime || new Date()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button onClick={() => handleViewReport(s._id)} disabled={reportLoading} style={{ width: '100%', padding: '11px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                                        {reportLoading ? 'Loading Report...' : 'View Detailed Report'}
                                    </button>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <button onClick={() => handleDownloadCardCSV(s._id)} disabled={downloadingId === s._id} style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <FaDownload /> {downloadingId === s._id ? 'Exporting...' : 'Export CSV'}
                                        </button>
                                        <button onClick={async () => {
                                            const data = await fetchReportData(s._id);
                                            handlePrintPDF(data);
                                        }} style={{ padding: '8px', background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid rgba(2, 132, 199, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <FaPrint /> Print PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Files Modal */}
            {viewFilesModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#0f172a', width: '90%', maxWidth: '1000px', height: '80vh', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090d16' }}>
                            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>Files - {viewFilesModal.fullName || viewFilesModal.username}</h3>
                            <button onClick={() => { setViewFilesModal(null); setSelectedFile(null); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            <div style={{ width: '250px', borderRight: '1px solid #1e293b', background: '#090d16', overflowY: 'auto', padding: '10px' }}>
                                {viewFilesModal.files?.map((f, i) => (
                                    <div key={i} onClick={() => setSelectedFile(f)} style={{ padding: '10px', cursor: 'pointer', borderRadius: '6px', background: selectedFile?.name === f.name ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: selectedFile?.name === f.name ? '#3b82f6' : '#cbd5e1', marginBottom: '4px', wordBreak: 'break-all', fontSize: '14px' }}>
                                        {f.name || `file_${i + 1}`}
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#1e293b' }}>
                                {selectedFile ? (
                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#f8fafc' }}>{selectedFile.name}</h4>
                                        <pre style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #334155', margin: 0 }}>
                                            <code style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}>
                                                {selectedFile.content || 'No content available.'}
                                            </code>
                                        </pre>
                                    </div>
                                ) : (
                                    <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Select a file to view its content</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabReports;
