import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBookOpen, FaFlask, FaPlus } from 'react-icons/fa';

const AcademicConfig = ({ token }) => {
    const [innerTab, setInnerTab] = useState('courses');
    
    // States for Courses
    const [courses, setCourses] = useState([]);
    const [courseDept, setCourseDept] = useState('');
    const [courseYear, setCourseYear] = useState('');
    const [courseName, setCourseName] = useState('');
    const [courseCode, setCourseCode] = useState('');
    
    // States for Lab Rooms
    const [labRooms, setLabRooms] = useState([]);
    const [labName, setLabName] = useState('');
    const [labCapacity, setLabCapacity] = useState('60');

    const api = axios.create({
        baseURL: '/api/admin',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchCourses();
        fetchLabRooms();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchLabRooms = async () => {
        try {
            const res = await api.get('/labrooms');
            setLabRooms(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        try {
            await api.post('/courses', { department: courseDept, year: courseYear, name: courseName, code: courseCode });
            setCourseDept(''); setCourseYear(''); setCourseName(''); setCourseCode('');
            fetchCourses();
        } catch (err) { console.error(err); }
    };

    const handleAddLabRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post('/labrooms', { name: labName, capacity: labCapacity });
            setLabName(''); setLabCapacity('60');
            fetchLabRooms();
        } catch (err) { console.error(err); }
    };

    const containerStyle = { padding: '40px', maxWidth: '1200px', margin: '0 auto' };
    const cardStyle = {
        background: '#ffffff', borderRadius: '16px', padding: '32px',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '24px'
    };
    
    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: '8px',
        border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontSize: '14px', outline: 'none'
    };
    const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#475569', textTransform: 'uppercase' };
    const buttonStyle = {
        background: '#4f46e5', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: '600',
        fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
    };

    const getTabBtnStyle = (id) => ({
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', background: 'transparent',
        borderBottom: innerTab === id ? '2px solid #4f46e5' : '2px solid transparent', color: innerTab === id ? '#4f46e5' : '#64748b',
        fontWeight: innerTab === id ? '600' : '500', transition: 'all 0.2s', fontSize: '14px'
    });

    return (
        <div style={containerStyle}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0', color: '#0f172a', letterSpacing: '-1px' }}>Academic Configuration</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: '16px', maxWidth: '600px', lineHeight: '1.5' }}>
                    Manage curriculum, official courses, subjects, and physical lab rooms.
                </p>
            </motion.div>

            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '32px' }}>
                <button style={getTabBtnStyle('courses')} onClick={() => setInnerTab('courses')}><FaBookOpen /> Global Courses</button>
                <button style={getTabBtnStyle('labs')} onClick={() => setInnerTab('labs')}><FaFlask /> Lab Infrastructure</button>
            </div>

            {innerTab === 'courses' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Add Course</h3>
                        <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div><label style={labelStyle}>Dept (e.g. CSE)</label><input style={inputStyle} value={courseDept} onChange={e=>setCourseDept(e.target.value)} required /></div>
                                <div><label style={labelStyle}>Year (e.g. 3)</label><input style={inputStyle} value={courseYear} onChange={e=>setCourseYear(e.target.value)} required /></div>
                            </div>
                            <div><label style={labelStyle}>Course Name (e.g. Java Lab)</label><input style={inputStyle} value={courseName} onChange={e=>setCourseName(e.target.value)} required /></div>
                            <div><label style={labelStyle}>Course Code (e.g. CS301)</label><input style={inputStyle} value={courseCode} onChange={e=>setCourseCode(e.target.value)} required /></div>
                            <button type="submit" style={buttonStyle}><FaPlus /> Create Course</button>
                        </form>
                    </div>
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Course Catalog</h3>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {courses.length === 0 ? <p style={{ color: '#94a3b8' }}>No courses configured.</p> : courses.map(c => (
                                <div key={c._id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{c.name} <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>({c.code})</span></h4>
                                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{c.department} - Y{c.year}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {innerTab === 'labs' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Add Lab Room</h3>
                        <form onSubmit={handleAddLabRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div><label style={labelStyle}>Room Name (e.g. Lab 1)</label><input style={inputStyle} value={labName} onChange={e=>setLabName(e.target.value)} required /></div>
                            <div><label style={labelStyle}>Capacity</label><input type="number" style={inputStyle} value={labCapacity} onChange={e=>setLabCapacity(e.target.value)} required /></div>
                            <button type="submit" style={buttonStyle}><FaPlus /> Add Room</button>
                        </form>
                    </div>
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>Physical Labs</h3>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {labRooms.length === 0 ? <p style={{ color: '#94a3b8' }}>No lab rooms configured.</p> : labRooms.map(r => (
                                <div key={r._id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{r.name}</span>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>Cap: {r.capacity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicConfig;
