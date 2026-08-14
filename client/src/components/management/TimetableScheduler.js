import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaTrashAlt, FaPlus, FaChalkboardTeacher } from 'react-icons/fa';

const TimetableScheduler = ({ token }) => {
    const [structures, setStructures] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [courses, setCourses] = useState([]);
    const [labRooms, setLabRooms] = useState([]);
    const [timetable, setTimetable] = useState([]);

    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    
    const [dayOfWeek, setDayOfWeek] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [facultyId, setFacultyId] = useState('');
    const [labRoom, setLabRoom] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const api = axios.create({
        baseURL: '/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchStructures();
        fetchFaculty();
        fetchCourses();
        fetchLabRooms();
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

    const fetchCourses = async () => {
        try {
            const res = await api.get('/admin/courses');
            if (Array.isArray(res.data)) setCourses(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchLabRooms = async () => {
        try {
            const res = await api.get('/admin/labrooms');
            if (Array.isArray(res.data)) setLabRooms(res.data);
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
                department, year, section, dayOfWeek, startTime, endTime, subjectName, facultyId, labRoom
            });
            setMessage('success: Session allocated successfully!');
            fetchTimetable();
        } catch (err) {
            setMessage('error: ' + (err.response?.data?.error || 'Failed to allocate session'));
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this session?')) return;
        try {
            await api.delete(`/timetable/schedule/${id}`);
            fetchTimetable();
        } catch (err) { console.error("Failed to delete"); }
    };

    // Derived dropdown options
    const safeStructures = Array.isArray(structures) ? structures : [];
    const uniqueDepartments = [...new Set(safeStructures.map(s => s.department))];
    const availableYears = [...new Set(safeStructures.filter(s => s.department === department).map(s => s.year))];
    const structureForSec = safeStructures.find(s => s.department === department && s.year === year);
    const availableSections = structureForSec ? structureForSec.sections : [];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00', 
        '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    const containerStyle = { padding: '40px', maxWidth: '1200px', margin: '0 auto' };
    const cardStyle = {
        background: '#ffffff', borderRadius: '16px', padding: '32px',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '24px'
    };
    const inputStyle = {
        width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', 
        background: '#f8fafc', color: '#1e293b', fontSize: '14px', outline: 'none', transition: 'all 0.2s'
    };
    const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' };
    const buttonStyle = {
        width: '100%', background: '#4f46e5', color: '#fff', padding: '14px', borderRadius: '8px', fontWeight: '600',
        fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
    };

    return (
        <div style={containerStyle}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0', color: '#0f172a', letterSpacing: '-1px' }}>Master Timetable</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: '16px', maxWidth: '600px', lineHeight: '1.5' }}>
                    Allocate independent lab sessions across cohorts and physical infrastructure.
                </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                
                {/* Form */}
                <motion.div style={{ ...cardStyle, height: 'fit-content' }} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                            <FaPlus size={16} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1e293b' }}>Allocate Session</h3>
                    </div>

                    <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div>
                                <label style={labelStyle}>Dept</label>
                                <select required value={department} onChange={(e) => { setDepartment(e.target.value); setYear(''); setSection(''); }} style={{...inputStyle, background: '#fff'}}>
                                    <option value="">--</option>
                                    {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Year</label>
                                <select required value={year} onChange={(e) => { setYear(e.target.value); setSection(''); }} style={{...inputStyle, background: '#fff'}}>
                                    <option value="">--</option>
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Section</label>
                                <select required value={section} onChange={(e) => setSection(e.target.value)} style={{...inputStyle, background: '#fff'}}>
                                    <option value="">--</option>
                                    {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Day</label>
                                <select required value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} style={inputStyle}>
                                    <option value="">--</option>
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Start Time</label>
                                <select required value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle}>
                                    <option value="">--</option>
                                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>End Time</label>
                                <select required value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle}>
                                    <option value="">--</option>
                                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Subject / Course</label>
                            <select required value={subjectName} onChange={(e) => setSubjectName(e.target.value)} style={inputStyle}>
                                <option value="">-- Select Course --</option>
                                {courses.map(c => <option key={c._id} value={c.name}>{c.name} ({c.code})</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Assign Faculty</label>
                                <select required value={facultyId} onChange={(e) => setFacultyId(e.target.value)} style={inputStyle}>
                                    <option value="">-- Faculty --</option>
                                    {facultyList.map(f => <option key={f._id} value={f._id}>{f.username}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Lab Room</label>
                                <select required value={labRoom} onChange={(e) => setLabRoom(e.target.value)} style={inputStyle}>
                                    <option value="">-- Room --</option>
                                    {labRooms.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <AnimatePresence>
                            {message && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <div style={{ padding: '12px', borderRadius: '8px', background: message.startsWith('success') ? '#dcfce7' : '#fee2e2', color: message.startsWith('success') ? '#166534' : '#991b1b', fontSize: '13px', fontWeight: '600' }}>
                                        {message.split(': ')[1]}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <motion.button 
                            whileHover={!(isLoading || !section) ? { scale: 1.01 } : {}}
                            whileTap={!(isLoading || !section) ? { scale: 0.98 } : {}}
                            type="submit" disabled={isLoading || !section} 
                            style={{ ...buttonStyle, opacity: (isLoading || !section) ? 0.5 : 1, cursor: (isLoading || !section) ? 'not-allowed' : 'pointer' }}
                        >
                            {isLoading ? 'Processing...' : 'Confirm Allocation'}
                        </motion.button>
                    </form>
                </motion.div>

                {/* List View */}
                <motion.div style={{ ...cardStyle }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <FaCalendarAlt size={16} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1e293b' }}>Cohort Schedule</h3>
                    </div>

                    {!section ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaChalkboardTeacher size={24} color="#94a3b8" />
                            </div>
                            <p style={{ color: '#64748b', margin: 0 }}>Filter by cohort to view active schedule.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
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
                                                background: '#f8fafc', padding: '16px', borderRadius: '12px', 
                                                border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', 
                                                alignItems: 'center', position: 'relative', overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#4f46e5' }} />
                                            <div style={{ paddingLeft: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{t.dayOfWeek}</span>
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.startTime} - {t.endTime}</span>
                                                </div>
                                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '2px' }}>{t.subjectName}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                    Faculty: <span style={{fontWeight: '600', color: '#1e293b'}}>{t.facultyId?.username || 'Unknown'}</span> &bull; Room: <span style={{fontWeight: '600', color: '#1e293b'}}>{t.labRoom || 'Unknown'}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(t._id)}
                                                style={{ border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                                            >
                                                <FaTrashAlt size={14} />
                                            </button>
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

export default TimetableScheduler;
