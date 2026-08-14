import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaUserCheck, FaUserTimes, FaTrashAlt } from 'react-icons/fa';

const StudentOnboarding = ({ token }) => {
    const [structures, setStructures] = useState([]);
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    const [rollNumbers, setRollNumbers] = useState('');
    const [students, setStudents] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const api = axios.create({
        baseURL: '/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchStructures();
    }, []);

    useEffect(() => {
        if (department && year && section) {
            fetchStudents();
        } else {
            setStudents([]);
        }
    }, [department, year, section]);

    const fetchStructures = async () => {
        try {
            const res = await api.get('/timetable/structure');
            if (Array.isArray(res.data)) {
                setStructures(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get(`/timetable/students?department=${department}&year=${year}&section=${section}`);
            if (Array.isArray(res.data)) {
                setStudents(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const rolls = rollNumbers.split(',').map(r => r.trim()).filter(r => r);
            const res = await api.post('/timetable/students/bulk-add', {
                department, year, section, rollNumbersString: rollNumbers
            });
            setMessage(res.data.message || 'Students synthesized successfully');
            setRollNumbers('');
            fetchStudents();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Registry failure');
        }
        setIsLoading(false);
    };

    const handleToggleStatus = async (studentId, currentStatus) => {
        try {
            await api.put(`/timetable/students/${studentId}/status`, {
                isActiveStudent: !currentStatus
            });
            fetchStudents();
        } catch (err) {
            console.error(err);
        }
    };

    const safeStructures = Array.isArray(structures) ? structures : [];
    const uniqueDepartments = [...new Set(safeStructures.map(s => s.department))];
    const availableYears = [...new Set(safeStructures.filter(s => s.department === department).map(s => s.year))];
    const structureForSec = safeStructures.find(s => s.department === department && s.year === year);
    const availableSections = structureForSec ? structureForSec.sections : [];

    const inputStyle = { 
        width: '100%', 
        backgroundColor: 'rgba(15, 23, 42, 0.5)', 
        color: '#f8fafc', 
        padding: '12px 16px', 
        borderRadius: '12px', 
        border: '1px solid rgba(148, 163, 184, 0.1)', 
        boxSizing: 'border-box',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.3s ease'
    };

    const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' };

    const glassCardStyle = {
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '32px',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    };

    const tableHeaderStyle = { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', textAlign: 'left', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' };
    const tableCellStyle = { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#f1f5f9' };

    return (
        <div style={{ color: '#fff', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Student Directory Matrix</h2>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px' }}>Onboard cohorts and manage access control seamlessly.</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
                
                {/* Registration Form */}
                <motion.div style={{ ...glassCardStyle, height: 'fit-content' }} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <FaUserPlus color="#60a5fa" size={18} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Batch Enrollment</h3>
                    </div>

                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Dept</label>
                                <select required value={department} onChange={(e) => { setDepartment(e.target.value); setYear(''); setSection(''); }} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}>
                                    <option value="" style={{ background: '#0f172a' }}>--</option>
                                    {uniqueDepartments.map(d => <option key={d} value={d} style={{ background: '#0f172a' }}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Year</label>
                                <select required value={year} onChange={(e) => { setYear(e.target.value); setSection(''); }} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}>
                                    <option value="" style={{ background: '#0f172a' }}>--</option>
                                    {availableYears.map(y => <option key={y} value={y} style={{ background: '#0f172a' }}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Section</label>
                                <select required value={section} onChange={(e) => setSection(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}>
                                    <option value="" style={{ background: '#0f172a' }}>--</option>
                                    {availableSections.map(s => <option key={s} value={s} style={{ background: '#0f172a' }}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Identities (Comma Separated Roll Nos)</label>
                            <textarea 
                                required
                                value={rollNumbers}
                                onChange={e => setRollNumbers(e.target.value)}
                                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                                placeholder="e.g. 21B81A0501, 21B81A0502"
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}
                            ></textarea>
                        </div>

                        <AnimatePresence>
                            {message && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <p style={{ fontSize: '13px', fontWeight: '600', padding: '12px 16px', borderRadius: '8px', background: message.includes('success') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)', color: message.includes('success') ? '#4ade80' : '#f87171', border: `1px solid ${message.includes('success') ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`, margin: 0 }}>
                                        {message}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <motion.button 
                            whileHover={!(isLoading || !section) ? { scale: 1.02, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' } : {}}
                            whileTap={!(isLoading || !section) ? { scale: 0.98 } : {}}
                            type="submit" disabled={isLoading || !section} 
                            style={{ 
                                width: '100%', background: 'linear-gradient(90deg, #2563eb, #4f46e5)', color: '#fff', 
                                padding: '16px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', border: 'none', 
                                cursor: (isLoading || !section) ? 'not-allowed' : 'pointer', opacity: (isLoading || !section) ? 0.5 : 1,
                                transition: 'all 0.3s ease', letterSpacing: '0.5px'
                            }}
                        >
                            {isLoading ? 'Processing Cohort...' : 'Initialize Students'}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Directory List */}
                <motion.div style={glassCardStyle} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(167, 139, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                                <FaUserCheck color="#a78bfa" size={18} />
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Section Roster</h3>
                        </div>
                        {section && (
                            <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' }}>
                                {department} · Yr {year} · Sec {section}
                            </span>
                        )}
                    </div>
                    
                    {!section ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', border: '2px dashed rgba(148, 163, 184, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                            </div>
                            <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>Specify parameters to view registry.</p>
                        </div>
                    ) : (
                        <div>
                            {(!Array.isArray(students) || students.length === 0) ? (
                                <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>No entities detected in this sector.</div>
                            ) : (
                                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                        <thead>
                                            <tr>
                                                <th style={tableHeaderStyle}>Roll Number</th>
                                                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Network Status</th>
                                                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Override</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {students.map((student, idx) => (
                                                    <motion.tr 
                                                        key={student._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.02 }}
                                                        style={{ transition: 'background 0.2s ease' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <td style={{ ...tableCellStyle, fontWeight: '700', color: '#e2e8f0' }}>{student.rollNumber}</td>
                                                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                                                            <span style={{ 
                                                                padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', 
                                                                color: student.isActiveStudent ? '#4ade80' : '#f87171', 
                                                                backgroundColor: student.isActiveStudent ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                                                border: `1px solid ${student.isActiveStudent ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                                                            }}>
                                                                {student.isActiveStudent ? 'AUTHORIZED' : 'LOCKED'}
                                                            </span>
                                                        </td>
                                                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                                            <motion.button 
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleToggleStatus(student._id, student.isActiveStudent)}
                                                                style={{ 
                                                                    border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', 
                                                                    backgroundColor: student.isActiveStudent ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.1)', 
                                                                    color: student.isActiveStudent ? '#f87171' : '#4ade80',
                                                                    border: `1px solid ${student.isActiveStudent ? 'rgba(220, 38, 38, 0.2)' : 'rgba(22, 163, 74, 0.2)'}`,
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                                title={student.isActiveStudent ? 'Revoke Access' : 'Grant Access'}
                                                            >
                                                                {student.isActiveStudent ? <FaUserTimes size={14} /> : <FaUserCheck size={14} />}
                                                            </motion.button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
};

export default StudentOnboarding;
