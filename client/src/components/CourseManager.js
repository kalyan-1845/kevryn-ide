import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaBook, FaUsers, FaArrowLeft, FaTrash, FaCog, FaGraduationCap, FaLayerGroup } from 'react-icons/fa';
import { motion } from 'framer-motion';

const CourseManager = ({ token, serverUrl }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // View state
    const [activeCourse, setActiveCourse] = useState(null);
    const [activeBatch, setActiveBatch] = useState(null);

    // Form States
    const [newCourse, setNewCourse] = useState({ name: '', code: '', semester: 'Sem 1', description: '' });
    const [newBatch, setNewBatch] = useState({ name: '', year: '', section: '', schedule: { day: '', time: '' } });
    const [studentInput, setStudentInput] = useState("");
    const [showAddBatch, setShowAddBatch] = useState(false);

    const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/api/courses');
            setCourses(res.data);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const handleCreateCourse = async () => {
        if (!newCourse.name || !newCourse.code) return alert("Name and Code are required");
        try {
            const res = await api.post('/api/courses', newCourse);
            setCourses([...courses, res.data.course]);
            setShowCreateModal(false);
            setNewCourse({ name: '', code: '', semester: 'Sem 1', description: '' });
        } catch (e) {
            alert("Failed to create course");
        }
    };

    const handleDeleteCourse = async (courseId, courseName, studentCount) => {
        const confirmMsg = studentCount > 0
            ? `WARNING: This course has ${studentCount} enrolled students!\n\nAre you sure you want to delete "${courseName}"?\nAll batch data and student enrollments will be lost.`
            : `Are you sure you want to delete "${courseName}"?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.delete(`/api/courses/${courseId}`);
            setCourses(courses.filter(c => c._id !== courseId));
            setActiveCourse(null);
        } catch (e) {
            alert("Failed to delete course: " + (e.response?.data?.error || e.message));
        }
    };

    const handleCreateBatch = async () => {
        if (!newBatch.name || !activeCourse) return alert("Batch name required");
        try {
            const res = await api.post(`/api/courses/${activeCourse._id}/batches`, {
                name: newBatch.name,
                year: newBatch.year,
                section: newBatch.section,
                schedule: newBatch.schedule
            });
            const updatedBatch = res.data.batch;
            
            setCourses(courses.map(c => {
                if (c._id === activeCourse._id) {
                    const newBatches = [...(c.batches || []), updatedBatch];
                    setActiveCourse({ ...c, batches: newBatches });
                    return { ...c, batches: newBatches };
                }
                return c;
            }));
            
            setShowAddBatch(false);
            setNewBatch({ name: '', year: '', section: '', schedule: { day: '', time: '' } });
            setActiveBatch(updatedBatch);
        } catch (e) {
            alert("Failed to create batch: " + (e.response?.data?.error || e.message));
        }
    };

    const handleEnrollStudents = async () => {
        if (!studentInput.trim() || !activeBatch) return;
        const students = studentInput.split(/[\n, ]+/).map(s => s.trim()).filter(s => s);
        if (students.length === 0) return;
        
        try {
            const res = await api.post(`/api/batches/${activeBatch._id}/enroll`, { students });
            const updatedBatch = res.data.batch;
            setStudentInput("");
            
            setActiveBatch(updatedBatch);
            
            setCourses(prev => prev.map(c => {
                if (c._id === activeCourse._id) {
                    const updatedBatches = c.batches.map(b => b._id === activeBatch._id ? updatedBatch : b);
                    setActiveCourse(current => ({ ...current, batches: updatedBatches }));
                    return { ...c, batches: updatedBatches };
                }
                return c;
            }));
        } catch (e) {
            alert("Enrollment failed: " + (e.response?.data?.error || e.message));
        }
    };

    const handleRemoveStudent = async (username) => {
        if (!window.confirm(`Remove ${username} from ${activeBatch.name}?`)) return;
        try {
            await api.post(`/api/batches/${activeBatch._id}/remove-student`, { username });
            
            const updatedStudents = activeBatch.students.filter(s => s.username !== username);
            const updatedBatch = { ...activeBatch, students: updatedStudents };
            
            setActiveBatch(updatedBatch);
            
            setCourses(prev => prev.map(c => {
                if (c._id === activeCourse._id) {
                    const updatedBatches = c.batches.map(b => b._id === activeBatch._id ? updatedBatch : b);
                    setActiveCourse(current => ({ ...current, batches: updatedBatches }));
                    return { ...c, batches: updatedBatches };
                }
                return c;
            }));
        } catch (e) {
            alert("Failed to remove student");
        }
    };

    // --- SUB-COMPONENTS ---
    const renderCourseGrid = () => (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                        Course <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Command Center</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>Deploy and manage your subjects, sections, and student rosters.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '800',
                        fontSize: '14px',
                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <FaPlus size={14} /> NEW COURSE
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
                {courses.map(course => {
                    const totalStudents = course.batches?.reduce((sum, b) => sum + (b.students?.length || 0), 0) || 0;
                    return (
                        <motion.div 
                            key={course._id} 
                            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                            onClick={() => { setActiveCourse(course); setActiveBatch(null); setShowAddBatch(false); }}
                            style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: '24px',
                                padding: '30px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}></div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaBook size={20} />
                                </div>
                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' }}>
                                    {course.code} • {course.semester}
                                </span>
                            </div>

                            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', margin: '0 0 10px 0' }}>{course.name}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.5', flex: 1 }}>{course.description || "No description provided."}</p>

                            <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Batches</div>
                                    <div style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}><FaLayerGroup color="#6366f1" size={14}/> {course.batches?.length || 0}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Students</div>
                                    <div style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}><FaGraduationCap color="#10b981" size={16}/> {totalStudents}</div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );

    const renderCourseDetails = () => (
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column', fontFamily: "'Outfit', sans-serif", background: '#020617' }}>
            {/* Header */}
            <div style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <button 
                        onClick={() => setActiveCourse(null)}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                        <FaArrowLeft size={16} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <span style={{ padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>{activeCourse.code}</span>
                            <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>{activeCourse.semester}</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', margin: 0 }}>{activeCourse.name}</h1>
                    </div>
                </div>
                <button 
                    onClick={() => handleDeleteCourse(activeCourse._id, activeCourse.name, activeCourse.batches?.reduce((acc, b) => acc + (b.students?.length || 0), 0))}
                    style={{ padding: '12px 24px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <FaTrash /> DELETE COURSE
                </button>
            </div>

            {/* Split View */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* LEFT SIDEBAR - BATCHES */}
                <div style={{ width: '380px', background: 'rgba(15, 23, 42, 0.2)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}><FaLayerGroup color="#6366f1" /> BATCHES</h3>
                        <button 
                            onClick={() => { setShowAddBatch(true); setActiveBatch(null); }}
                            style={{ background: '#6366f1', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <FaPlus size={12} />
                        </button>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {activeCourse.batches?.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}><FaUsers size={24} /></div>
                                <p style={{ margin: 0, fontSize: '14px' }}>No batches created yet.<br/>Click + to deploy a new batch.</p>
                            </div>
                        ) : (
                            activeCourse.batches?.map(b => (
                                <motion.div 
                                    key={b._id}
                                    whileHover={{ x: 4 }}
                                    onClick={() => { setActiveBatch(b); setShowAddBatch(false); }}
                                    style={{ 
                                        padding: '16px', 
                                        marginBottom: '12px', 
                                        borderRadius: '12px', 
                                        cursor: 'pointer',
                                        background: activeBatch?._id === b._id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${activeBatch?._id === b._id ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: activeBatch?._id === b._id ? '#818cf8' : '#e2e8f0' }}>{b.name}</h4>
                                        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', color: '#94a3b8' }}>{b.students?.length || 0} STS</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                        {b.year && <span>{b.year}</span>}
                                        {b.section && <span>Sec {b.section}</span>}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT MAIN AREA */}
                <div style={{ flex: 1, position: 'relative', background: 'rgba(2, 6, 23, 0.3)' }}>
                    {showAddBatch ? (
                        <div style={{ padding: '60px', maxWidth: '600px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginBottom: '8px' }}>Deploy New Batch</h2>
                            <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Define the year, section, and schedule for this batch.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Batch Name / Identifier</label>
                                    <input placeholder="e.g. Morning Shift, Group A" value={newBatch.name} onChange={e => setNewBatch({ ...newBatch, name: e.target.value })} style={{ width: '100%', padding: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', fontSize: '15px' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Academic Year</label>
                                        <select value={newBatch.year} onChange={e => setNewBatch({ ...newBatch, year: e.target.value })} style={{ width: '100%', padding: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', fontSize: '15px', outline: 'none' }}>
                                            <option value="">- Select Year -</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Section</label>
                                        <input placeholder="e.g. A, B, CSE-1" value={newBatch.section} onChange={e => setNewBatch({ ...newBatch, section: e.target.value })} style={{ width: '100%', padding: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', fontSize: '15px' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Schedule Day</label>
                                        <input placeholder="e.g. Monday" value={newBatch.schedule.day} onChange={e => setNewBatch({ ...newBatch, schedule: { ...newBatch.schedule, day: e.target.value } })} style={{ width: '100%', padding: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', fontSize: '15px' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Time Slot</label>
                                        <input placeholder="e.g. 10:00 AM" value={newBatch.schedule.time} onChange={e => setNewBatch({ ...newBatch, schedule: { ...newBatch.schedule, time: e.target.value } })} style={{ width: '100%', padding: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', fontSize: '15px' }} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px' }}>
                                    <button onClick={handleCreateBatch} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)' }}>CREATE BATCH</button>
                                </div>
                            </div>
                        </div>
                    ) : activeBatch ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', margin: '0 0 8px 0' }}>{activeBatch.name} <span style={{ fontWeight: '400', color: '#64748b' }}>Roster</span></h2>
                                        <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                                            {activeBatch.year && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaUsers size={12}/> {activeBatch.year}</span>}
                                            {activeBatch.section && <span>Sec {activeBatch.section}</span>}
                                            {activeBatch.schedule?.day && <span>• {activeBatch.schedule.day} {activeBatch.schedule.time}</span>}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaGraduationCap size={24} /> {activeBatch.students?.length || 0} Enrolled
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                <div style={{ width: '350px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#f1f5f9', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>Enroll Students</h3>
                                    <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>Paste student Usernames (Roll Numbers) separated by spaces or newlines.</p>
                                    <textarea 
                                        value={studentInput} 
                                        onChange={e => setStudentInput(e.target.value)} 
                                        placeholder="24AG1A05K1&#10;24AG1A05K2..." 
                                        style={{ flex: 1, padding: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', resize: 'none', fontFamily: 'monospace' }} 
                                    />
                                    <button 
                                        onClick={handleEnrollStudents} 
                                        style={{ padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)', fontSize: '14px' }}
                                    >
                                        EXECUTE ENROLLMENT
                                    </button>
                                </div>
                                
                                <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                                    {activeBatch.students?.length > 0 ? (
                                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Index</th>
                                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Username / Roll No</th>
                                                        <th style={{ padding: '16px 24px', textAlign: 'right', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeBatch.students.map((s, idx) => (
                                                        <tr key={s.username} style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                            <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px', fontWeight: '700', width: '60px' }}>{(idx + 1).toString().padStart(2, '0')}</td>
                                                            <td style={{ padding: '16px 24px', color: '#f8fafc', fontSize: '15px', fontWeight: '600' }}>{s.username}</td>
                                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                                <button onClick={() => handleRemoveStudent(s.username)} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Revoke Access</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                                            <FaGraduationCap size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                            <p style={{ fontSize: '16px' }}>This batch is currently empty.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
                            <FaCog size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
                            <h2 style={{ color: '#64748b', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Select or Deploy a Batch</h2>
                            <p>Choose a batch from the sidebar to manage enrollments.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ height: '100%', background: '#020617', overflowY: 'auto' }}>
            {activeCourse ? renderCourseDetails() : renderCourseGrid()}

            {/* CREATE COURSE MODAL */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#0f172a', padding: '40px', borderRadius: '24px', width: '500px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '900' }}>Initialize Course</h2>
                        <p style={{ color: '#94a3b8', margin: '0 0 24px 0', fontSize: '14px' }}>Define the core subject parameters.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Course Title</label>
                                <input placeholder="e.g. Data Structures & Algorithms" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', borderRadius: '10px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Course Code</label>
                                    <input placeholder="e.g. CS201" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', borderRadius: '10px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Semester</label>
                                    <select value={newCourse.semester} onChange={e => setNewCourse({ ...newCourse, semester: e.target.value })} style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', borderRadius: '10px', outline: 'none' }}>
                                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`Sem ${s}`}>Sem {s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Description (Optional)</label>
                                <textarea placeholder="Brief overview of the course content..." value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', borderRadius: '10px', height: '80px', resize: 'none' }} />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                            <button onClick={handleCreateCourse} style={{ flex: 1, padding: '14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>DEPLOY COURSE</button>
                            <button onClick={() => setShowCreateModal(false)} style={{ padding: '14px 24px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManager;
