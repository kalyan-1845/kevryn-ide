import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaFlask, FaPlus } from 'react-icons/fa';

const AcademicConfig = ({ token }) => {
    const [innerTab, setInnerTab] = useState('courses');

    const containerStyle = { padding: '40px', maxWidth: '1200px', margin: '0 auto' };
    const cardStyle = {
        background: '#ffffff', borderRadius: '16px', padding: '32px',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '24px'
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
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Course Catalog</h3>
                        <button style={{ background: '#4f46e5', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaPlus /> Add Course
                        </button>
                    </div>
                    
                    <div style={{ padding: '60px 0', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                        <FaBookOpen size={32} color="#94a3b8" style={{ marginBottom: '16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '16px' }}>No Courses Configured</h4>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Once added, these courses will be available for Timetable allocation.</p>
                    </div>
                </div>
            )}

            {innerTab === 'labs' && (
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Physical Labs</h3>
                        <button style={{ background: '#4f46e5', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaPlus /> Add Room
                        </button>
                    </div>
                    
                    <div style={{ padding: '60px 0', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                        <FaFlask size={32} color="#94a3b8" style={{ marginBottom: '16px' }} />
                        <h4 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '16px' }}>No Lab Rooms Configured</h4>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Register physical spaces (e.g. Lab 1, Computer Center) for scheduling conflict detection.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicConfig;
