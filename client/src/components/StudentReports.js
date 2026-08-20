import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
    FaBook, FaUser, FaCode, FaFilePdf, FaClock, FaCalendar, FaSearch,
    FaShieldAlt, FaChartBar, FaTasks, FaCheckCircle, FaExclamationTriangle,
    FaArrowRight, FaDownload, FaBrain, FaFingerprint, FaRobot
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const StudentReports = ({ token, serverUrl, onClose, preSelectedCohort }) => {
    const reportRef = useRef(null);
    const [cohorts, setCohorts] = useState([]);
    const [selectedCohortStr, setSelectedCohortStr] = useState(
        preSelectedCohort ? JSON.stringify({
            department: preSelectedCohort.department,
            year: preSelectedCohort.year,
            section: preSelectedCohort.section,
            subjectName: preSelectedCohort.subjectName,
            label: `${preSelectedCohort.department} - Yr ${preSelectedCohort.year} - Sec ${preSelectedCohort.section} (${preSelectedCohort.subjectName})`
        }) : ""
    );
    const selectedCohort = useMemo(() => selectedCohortStr ? JSON.parse(selectedCohortStr) : null, [selectedCohortStr]);
    const [searchTerm, setSearchTerm] = useState("");
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [studentSubmissions, setStudentSubmissions] = useState([]);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const api = useMemo(() => {
        return axios.create({ baseURL: serverUrl, headers: { Authorization: token } });
    }, [serverUrl, token]);

    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const res = await api.get('/api/timetable/my-schedule/faculty');
                const schedule = res.data.schedule || res.data || [];
                
                // Extract unique cohorts (Department, Year, Section, Subject)
                const uniqueMap = new Map();
                if (Array.isArray(schedule)) {
                    schedule.forEach(slot => {
                        if (slot.department && slot.year && slot.section && slot.subjectName) {
                            const key = `${slot.department}-${slot.year}-${slot.section}-${slot.subjectName}`;
                            if (!uniqueMap.has(key)) {
                                uniqueMap.set(key, {
                                    department: slot.department,
                                    year: slot.year,
                                    section: slot.section,
                                    subjectName: slot.subjectName,
                                    label: `${slot.department} - Yr ${slot.year} - Sec ${slot.section} (${slot.subjectName})`
                                });
                            }
                        }
                    });
                }
                setCohorts(Array.from(uniqueMap.values()));
            } catch (e) { console.error("Failed to fetch timetable cohorts", e); }
        };
        fetchCohorts();
    }, [api]);

    useEffect(() => {
        if (!selectedCohort) return;
        const fetchReports = async () => {
            try {
                const query = `?department=${encodeURIComponent(selectedCohort.department)}&year=${selectedCohort.year}&section=${encodeURIComponent(selectedCohort.section)}&subjectName=${encodeURIComponent(selectedCohort.subjectName)}`;
                const res = await api.get(`/lab/reports/cohort${query}`);
                setReports(res.data);
                setSelectedReport(null);
            } catch (e) {
                console.error("Failed to fetch reports", e);
                setReports([]);
            }
        };
        fetchReports();
    }, [selectedCohortStr, api]);

    useEffect(() => {
        if (!selectedReport || !selectedCohort) return;
        const fetchStudentSubmissions = async () => {
            setIsLoadingSubmissions(true);
            try {
                const username = selectedReport.studentId?.username;
                if (!username) return;
                const query = `?department=${encodeURIComponent(selectedCohort.department)}&year=${selectedCohort.year}&section=${encodeURIComponent(selectedCohort.section)}&subjectName=${encodeURIComponent(selectedCohort.subjectName)}`;
                const res = await api.get(`/api/assignments/cohort${query}`);
                
                // res.data is an array of assignments with .submissions array
                // We only want the submissions for the selected student
                const studentSpecificAssignments = res.data.map(assignment => {
                    return {
                        ...assignment,
                        submissions: assignment.submissions ? assignment.submissions.filter(s => s.studentUsername === username) : []
                    };
                });
                setStudentSubmissions(studentSpecificAssignments);
            } catch (e) {
                console.error("Failed to fetch submissions", e);
                setStudentSubmissions([]);
            } finally {
                setIsLoadingSubmissions(false);
            }
        };
        fetchStudentSubmissions();
    }, [selectedReport, selectedCohortStr, api]);

    const handleDownload = (report) => {
        if (!report) return;
        setIsExporting(true);
        try {
            const printWindow = window.open('', '_blank');
            const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            const studentName = report.studentId?.username || "Student";
            const subject = selectedCohort?.subjectName || "Unknown Subject";
            
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Security Dossier - ${studentName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #0f172a; font-size: 13px; line-height: 1.4; }
                        .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
                        .header h2 { margin: 0; color: #1e3a8a; font-size: 20px; text-transform: uppercase; }
                        .header h3 { margin: 4px 0 0 0; color: #0284c7; font-size: 14px; font-weight: 600; }
                        .header p { margin: 4px 0 0 0; color: #64748b; font-size: 11px; font-weight: bold; }
                        .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 12px; }
                        .meta-item strong { display: block; color: #475569; font-size: 10px; text-transform: uppercase; }
                        
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; margin-bottom: 20px; }
                        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                        th { background-color: #0f172a; color: #ffffff; font-weight: 600; text-transform: uppercase; font-size: 10px; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        
                        .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; text-transform: uppercase; }
                        .code-block { background: #0f172a; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: 'Consolas', 'Monaco', monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; margin-bottom: 15px; }
                        .code-header { background: #e2e8f0; padding: 6px 12px; font-size: 10px; font-weight: bold; color: #334155; border-radius: 6px 6px 0 0; display: flex; justify-content: space-between; }
                        
                        @media print {
                            body { padding: 0; }
                            @page { margin: 15mm; }
                            .code-block { page-break-inside: avoid; }
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
                        <p>OFFICIAL STUDENT SECURITY DOSSIER & PERFORMANCE AUDIT</p>
                    </div>

                    <div class="meta-grid">
                        <div class="meta-item"><strong>Student Identifier</strong>${studentName}</div>
                        <div class="meta-item"><strong>Course / Subject</strong>${subject}</div>
                        <div class="meta-item"><strong>Generated Date</strong>${dateStr}</div>
                        <div class="meta-item"><strong>Audit Result</strong><span style="${(report.attentionScore || 100) >= 80 ? 'color:#16a34a' : 'color:#dc2626'}">VERIFIED</span></div>
                    </div>

                    <div class="section-title">Telemetry & Integrity Overview</div>
                    <table>
                        <tr>
                            <th>Engagement Time</th>
                            <th>Focus Score</th>
                            <th>Tab Switches</th>
                            <th>Clipboard Pastes</th>
                            <th>Verdict</th>
                        </tr>
                        <tr>
                            <td><strong>${(report.totalTimeSpent / 60).toFixed(1)} min</strong></td>
                            <td style="color: ${(report.attentionScore || 100) >= 80 ? '#16a34a' : '#dc2626'}"><strong>${report.attentionScore || 100}%</strong></td>
                            <td style="color: ${report.tabSwitchCount > 5 ? '#dc2626' : '#475569'}"><strong>${report.tabSwitchCount || 0}</strong></td>
                            <td style="color: ${report.pasteCount > 8 ? '#dc2626' : '#475569'}"><strong>${report.pasteCount || 0}</strong></td>
                            <td><strong>${(report.attentionScore || 100) < 70 ? 'SUSPICIOUS' : 'CLEAN'}</strong></td>
                        </tr>
                    </table>

                    <div class="section-title">Assignment Logic Verification</div>
                    ${studentSubmissions.length === 0 ? '<p style="font-size: 12px; color: #64748b;">No logic assignments submitted.</p>' : `
                    <table>
                        <thead>
                            <tr>
                                <th>Assignment Title</th>
                                <th>Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${studentSubmissions.map(sub => `
                                <tr>
                                    <td>${sub.assignmentId?.title || 'Unknown Assignment'}</td>
                                    <td><strong>${sub.score}</strong> / ${sub.maxScore}</td>
                                    <td style="color: ${sub.score === sub.maxScore ? '#16a34a' : '#f59e0b'}"><strong>${sub.score === sub.maxScore ? 'PASSED' : 'PARTIAL'}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `}

                    <div class="section-title">Development Archive (Source Code Capture)</div>
                    ${(!report.files || report.files.length === 0) ? '<p style="font-size: 12px; color: #64748b;">No source code captured.</p>' : 
                        report.files.map(file => `
                            <div>
                                <div class="code-header">
                                    <span>${file.fileName}</span>
                                    <span>Modified: ${file.lastUpdated ? new Date(file.lastUpdated).toLocaleTimeString() : 'Unknown'} | Time: ${Math.ceil(file.timeSpent / 60)}m</span>
                                </div>
                                <div class="code-block">${file.code ? file.code.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '// No content capture identified.'}</div>
                            </div>
                        `).join('')
                    }
                </body>
                </html>
            `;
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const filteredReports = reports.filter(r =>
        r.studentId?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- RENDER HELPERS ---
    const getIntegrityColor = (score) => {
        if (score >= 90) return '#10b981';
        if (score >= 70) return '#f59e0b';
        return '#ef4444';
    };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {onClose && (
                <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 23, 42, 0.4)' }}>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>Back</button>
                </div>
            )}
        <div style={{ display: 'flex', height: '100%', background: 'transparent', color: '#e2e8f0', fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>

            {/* --- SIDEBAR: ROSTER --- */}
            <div style={{
                width: '320px',
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '30px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                        <FaChartBar color="#6366f1" size={20} />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Performance Hub</h2>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Target Cohort</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                onChange={(e) => setSelectedCohortStr(e.target.value)}
                                value={selectedCohortStr}
                                style={{
                                    width: '100%', 
                                    padding: '12px 35px 12px 16px', 
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)', 
                                    borderRadius: '8px',
                                    color: '#e2e8f0', 
                                    fontSize: '14px', 
                                    outline: 'none',
                                    appearance: 'none',
                                    boxSizing: 'border-box',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                                onFocus={(e) => e.target.style.border = '1px solid #6366f1'}
                                onBlur={(e) => e.target.style.border = '1px solid rgba(99, 102, 241, 0.3)'}
                            >
                                <option value="" style={{ background: '#0f172a' }}>-- Choose Cohort --</option>
                                {cohorts.map(c => (
                                    <option key={c.label} value={JSON.stringify(c)} style={{ background: '#0f172a' }}>{c.label}</option>
                                ))}
                            </select>
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6366f1' }}>
                                ▼
                            </div>
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '14px', top: '14px', color: '#475569' }} size={14} />
                        <input
                            type="text"
                            placeholder="Student Identity..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                                color: '#fff', fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {!selectedCohort ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
                            <FaBook size={32} style={{ opacity: 0.1, marginBottom: '16px' }} />
                            <div style={{ fontSize: '13px' }}>Select a course to view roster analytics.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {filteredReports.map(report => (
                                <motion.div
                                    key={report._id}
                                    whileHover={{ x: 4, background: 'rgba(255,255,255,0.03)' }}
                                    onClick={() => setSelectedReport(report)}
                                    style={{
                                        padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                                        background: selectedReport?._id === report._id ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))' : 'transparent',
                                        border: selectedReport?._id === report._id ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                            }}>
                                                {report.studentId?.picture ? (
                                                    <img src={report.studentId.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : <FaUser size={14} color="#475569" />}
                                            </div>
                                            <div style={{
                                                position: 'absolute', bottom: '-4px', right: '-4px',
                                                width: '14px', height: '14px', borderRadius: '50%',
                                                background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getIntegrityColor(report.attentionScore || 100) }} />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {report.studentId?.username || 'Redacted Student'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                                <span>⏱ {(report.totalTimeSpent / 60).toFixed(0)}m</span>
                                                <span style={{ color: report.attentionScore < 80 ? '#ef4444' : '#64748b' }}>🧠 {report.attentionScore || 100}%</span>
                                            </div>
                                        </div>
                                        <FaArrowRight size={10} color={selectedReport?._id === report._id ? '#6366f1' : 'transparent'} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT: BEAST REPORT --- */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    {!selectedReport ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
                        >
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '40px',
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '24px', border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <FaShieldAlt size={48} color="#6366f1" style={{ opacity: 0.3 }} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#475569' }}>Select Student Identity</h3>
                            <p style={{ fontSize: '14px', color: '#334155' }}>High-fidelity performance dossier will be rendered here.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedReport._id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ padding: '40px 60px' }}
                            ref={reportRef}
                        >
                            {/* Beast Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span style={{ padding: '4px 12px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '20px', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>KEVRYN IDE | KEVRYN ANALYTICS</span>
                                        <span style={{ fontSize: '11px', color: '#475569' }}>SESSION: {selectedCohort?.subjectName}</span>
                                    </div>
                                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                                        {selectedReport.studentId?.username?.toUpperCase()}
                                    </h1>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaUser color="#6366f1" /> UID: {selectedReport.studentId?._id?.slice(-6).toUpperCase()}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaBook color="#6366f1" /> SUBJECT: {selectedCohort?.subjectName}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaCalendar /> TIMELINE: {
                                                selectedReport.files.length > 0
                                                    ? new Date(Math.min(...selectedReport.files.map(f => new Date(f.lastUpdated).getTime()))).toLocaleDateString()
                                                    : new Date().toLocaleDateString()
                                            } - PRESENT
                                        </div>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isExporting}
                                    onClick={() => handleDownload(selectedReport)}
                                    style={{
                                        background: isExporting ? '#475569' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                        color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '14px',
                                        fontWeight: '800', fontSize: '14px', cursor: isExporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                        boxShadow: isExporting ? 'none' : '0 10px 30px rgba(99,102,241,0.3)', transition: 'all 0.2s'
                                    }}
                                >
                                    {isExporting ? <FaRobot className="spin-slow" /> : <FaDownload />}
                                    {isExporting ? 'GENERATING...' : 'EXPORT DOSSIER'}
                                </motion.button>
                            </div>

                            {/* Beast Metrics Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                                <MetricCard icon={<FaClock color="#60a5fa" />} label="Engagement Time" value={`${(selectedReport.totalTimeSpent / 60).toFixed(1)}m`} trend="Cumulative" />
                                <MetricCard icon={<FaBrain color="#a78bfa" />} label="Focus Score" value={`${selectedReport.attentionScore || 100}%`} trend={selectedReport.attentionScore < 80 ? 'CRITICAL' : 'OPTIMAL'} color={getIntegrityColor(selectedReport.attentionScore || 100)} />
                                <MetricCard icon={<FaFingerprint color="#4ade80" />} label="Integrity Flags" value={selectedReport.tabSwitchCount || 0} trend="Tab Switches" subValue={`${selectedReport.pasteCount || 0} Pastes`} />
                                <MetricCard icon={<FaTasks color="#fbbf24" />} label="Assignments" value={studentSubmissions.length} trend="Total Submissions" />
                            </div>

                            {/* Analysis & Security Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                                {/* Left: Assignment Sync */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div>
                                        <SectionTitle icon={<FaTasks />} title="Logic Checks" subtitle="Assignment verification" />
                                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', padding: '20px' }}>
                                            {isLoadingSubmissions ? (
                                                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Syncing telemetry...</div>
                                            ) : studentSubmissions.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: '13px' }}>No logic assignments identified.</div>
                                            ) : (
                                                <div style={{ display: 'grid', gap: '12px' }}>
                                                    {studentSubmissions.map(sub => (
                                                        <div key={sub._id} style={{
                                                            padding: '16px', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.5)',
                                                            border: '1px solid rgba(255,255,255,0.05)', position: 'relative'
                                                        }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>{sub.assignmentId?.title || 'Unknown Assignment'}</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ fontSize: '16px', fontWeight: '900', color: sub.score === sub.maxScore ? '#10b981' : '#f59e0b' }}>
                                                                    {sub.score} <span style={{ fontSize: '11px', color: '#475569', fontWeight: '400' }}>/ {sub.maxScore}</span>
                                                                </div>
                                                                {sub.score === sub.maxScore ? <FaCheckCircle color="#10b981" /> : <FaArrowRight color="#64748b" />}
                                                            </div>
                                                            <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${(sub.score / (sub.maxScore || 1)) * 100}%`, background: sub.score === sub.maxScore ? '#10b981' : '#f59e0b' }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Security Insights */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div>
                                        <SectionTitle icon={<FaShieldAlt />} title="Security Dossier" subtitle="AI behavioral analysis" />
                                        <div style={{
                                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(245, 158, 11, 0.05))',
                                            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', padding: '20px'
                                        }}>
                                            <SecurityItem
                                                icon={<FaExclamationTriangle color={selectedReport.tabSwitchCount > 5 ? '#ef4444' : '#64748b'} />}
                                                label="Tab Switching"
                                                value={selectedReport.tabSwitchCount || 0}
                                                desc={selectedReport.tabSwitchCount > 10 ? "High suspicious activity detected." : "Normal activity range."}
                                            />
                                            <SecurityItem
                                                icon={<FaCode color={selectedReport.pasteCount > 8 ? '#f59e0b' : '#64748b'} />}
                                                label="Paste Frequency"
                                                value={selectedReport.pasteCount || 0}
                                                desc={selectedReport.pasteCount > 15 ? "Plagiarism risk identified." : "Standard code management."}
                                            />
                                            <div style={{
                                                marginTop: '20px', padding: '12px', borderRadius: '12px',
                                                background: 'rgba(2, 6, 23, 0.4)', fontSize: '12px', color: '#94a3b8',
                                                border: '1px solid rgba(255,255,255,0.03)', lineHeight: '1.6'
                                            }}>
                                                <FaBrain style={{ marginRight: '8px' }} color="#6366f1" />
                                                <span style={{ fontWeight: '700', color: '#fff' }}>KevRyn AI Verdict:</span><br />
                                                {selectedReport.attentionScore < 70
                                                    ? "This student shows significant signs of disengagement or external assistance. Recommendation: Oral viva voce highly advised."
                                                    : selectedReport.attentionScore < 90
                                                        ? "Occasional distractions observed. Overall integrity is within acceptable bounds but monitor for consistency."
                                                        : "Excellent focus and high-integrity development lifecycle. No anomalies detected."
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Code Rendering */}
                            <div style={{ marginTop: '20px' }}>
                                <SectionTitle icon={<FaCode />} title="Development Archive" subtitle="Recent code captures and modifications" />
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {!selectedReport.files || selectedReport.files.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            No files created during live lab sessions.
                                        </div>
                                    ) : (
                                        selectedReport.files.map((file, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                style={{ background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}
                                            >
                                                <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <FaCode color="#818cf8" size={14} />
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '14px' }}>{file.fileName}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748b' }}>Modified {new Date(file.lastUpdated).toLocaleTimeString()}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                                                        ⏱ {(file.timeSpent / 60).toFixed(1)}m
                                                    </div>
                                                </div>
                                                <div style={{ padding: '20px', position: 'relative' }}>
                                                    <pre style={{
                                                        margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#cbd5e1',
                                                        overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto',
                                                        padding: '16px', background: 'transparent', borderRadius: '12px'
                                                    }}>
                                                        {file.code || "// No content capture identified."}
                                                    </pre>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
        </div>
    );
};

// --- SUBCOMPONENTS ---

const MetricCard = ({ icon, label, value, trend, subValue, color = '#6366f1' }) => (
    <div style={{
        background: 'rgba(15, 23, 42, 0.4)', padding: '24px', borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden'
    }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            {icon}
        </div>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>{value}</div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: color }}>{trend}</div>
        {subValue && <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{subValue}</div>}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60px', height: '60px', background: `radial-gradient(circle, ${color}10, transparent)`, borderRadius: '50%', transform: 'translate(20px, 20px)' }} />
    </div>
);

const SectionTitle = ({ icon, title, subtitle }) => (
    <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{ color: '#6366f1' }}>{icon}</div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>{title}</h3>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{subtitle}</p>
    </div>
);

const SecurityItem = ({ icon, label, value, desc }) => (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ marginTop: '4px' }}>{icon}</div>
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>{value}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{desc}</div>
        </div>
    </div>
);

export default StudentReports;




