import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaTrashAlt, FaChalkboardTeacher } from 'react-icons/fa';

const TimetableManager = ({ token }) => {
    const [structures, setStructures] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [timetable, setTimetable] = useState([]);

    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    
    const [dayOfWeek, setDayOfWeek] = useState('Monday');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('11:00');
    const [subjectName, setSubjectName] = useState('');
    const [facultyId, setFacultyId] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const api = axios.create({
        baseURL: '/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchStructures();
        fetchFaculty();
    }, []);

    useEffect(() => {
        if (department && year && section) {
            fetchTimetable();
        } else {
            setTimetable([]);
        }
    }, [department, year, section]);

    const fetchStructures = async () => {
        try {
            const res = await api.get('/timetable/structure');
            if (Array.isArray(res.data)) setStructures(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchFaculty = async () => {
        try {
            const res = await api.get('/admin/users?role=faculty');
            if (Array.isArray(res.data)) setFacultyList(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchTimetable = async () => {
        try {
            const res = await api.get(`/timetable/schedule?department=${department}&year=${year}&section=${section}`);
            if (Array.isArray(res.data)) setTimetable(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            await api.post('/timetable/schedule', {
                department, year, section, dayOfWeek, startTime, endTime, subjectName, facultyId
            });
            setMessage('Session allocated successfully!');
            fetchTimetable();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to allocate session');
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this session?')) return;
        try {
            await api.delete(`/timetable/schedule/${id}`);
            fetchTimetable();
        } catch (err) {
            console.error("Failed to delete");
        }
    };

    // Derived dropdown options
    const safeStructures = Array.isArray(structures) ? structures : [];
    const uniqueDepartments = [...new Set(safeStructures.map(s => s.department))];
    const availableYears = [...new Set(safeStructures.filter(s => s.department === department).map(s => s.year))];
    const structureForSec = safeStructures.find(s => s.department === department && s.year === year);
    const availableSections = structureForSec ? structureForSec.sections : [];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    return (
        <div style={{ color: '#fff', width: '100%', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Global Scheduler Engine</h2>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px' }}>Master schedule configuration for cohorts and lab sessions.</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
                
                {/* Form */}
                <motion.div style={{ ...glassCardStyle, height: 'fit-content' }} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <FaCalendarAlt color="#60a5fa" size={18} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Allocate Session</h3>
                    </div>

                    <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
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

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Day</label>
                                <select required value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}>
                                    {days.map(d => <option key={d} value={d} style={{ background: '#0f172a' }}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Start</label>
                                <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'} />
                            </div>
                            <div>
                                <label style={labelStyle}>End</label>
                                <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'} />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Subject / Lab Name</label>
                            <input type="text" required value={subjectName} onChange={(e) => setSubjectName(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'} placeholder="E.g. Data Structures Lab" />
                        </div>

                        <div>
                            <label style={labelStyle}>Assign Faculty</label>
                            <select required value={facultyId} onChange={(e) => setFacultyId(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}>
                                <option value="" style={{ background: '#0f172a' }}>-- Select Faculty --</option>
                                {facultyList.map(f => <option key={f._id} value={f._id} style={{ background: '#0f172a' }}>{f.username}</option>)}
                            </select>
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
                            {isLoading ? 'Processing...' : 'Confirm Allocation'}
                        </motion.button>
                    </form>
                </motion.div>

                {/* List View */}
                <motion.div style={{ ...glassCardStyle }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(167, 139, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                            <FaChalkboardTeacher color="#a78bfa" size={18} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Cohort Schedule</h3>
                    </div>

                    {!section ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', border: '2px dashed rgba(148, 163, 184, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </div>
                            <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>Filter by cohort to view active schedule.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                            {(!Array.isArray(timetable) || timetable.length === 0) ? (
                                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No sessions allocated for this cohort.</p>
                            ) : (
                                <AnimatePresence>
                                    {timetable.map((t, idx) => (
                                        <motion.div 
                                            key={t._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{ 
                                                background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '16px', 
                                                border: '1px solid rgba(255, 255, 255, 0.03)', display: 'flex', justifyContent: 'space-between', 
                                                alignItems: 'center', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)'; e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.03)'; }}
                                        >
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }} />
                                            <div style={{ paddingLeft: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{t.dayOfWeek}</span>
                                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', fontFamily: 'monospace' }}>{t.startTime} - {t.endTime}</span>
                                                </div>
                                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#fff', marginBottom: '4px' }}>{t.subjectName}</div>
                                                <div style={{ fontSize: '13px', color: '#a78bfa', fontWeight: '600' }}>Faculty: {t.facultyId?.username || 'Unknown'}</div>
                                            </div>
                                            <motion.button 
                                                whileHover={{ scale: 1.1, color: '#f87171' }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDelete(t._id)}
                                                style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: '8px' }}
                                            >
                                                <FaTrashAlt size={16} />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
};

export default TimetableManager;
