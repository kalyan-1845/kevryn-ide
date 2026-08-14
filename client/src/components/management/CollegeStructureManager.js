import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const CollegeStructureManager = ({ token }) => {
    const [structures, setStructures] = useState([]);
    const [department, setDepartment] = useState('CSE');
    const [year, setYear] = useState('1');
    const [sections, setSections] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const departments = ['CSE', 'ECE', 'IT', 'MECH', 'CIVIL', 'EEE', 'AIML', 'DS'];
    const years = ['1', '2', '3', '4'];

    useEffect(() => {
        fetchStructures();
    }, []);

    const api = axios.create({
        baseURL: '/api',
        headers: { Authorization: `Bearer ${token}` }
    });

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

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const sectionArray = sections.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
            await api.post('/timetable/structure', {
                department, year, sections: sectionArray
            });
            setMessage('Structure synchronized successfully');
            fetchStructures();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to synchronize');
        }
        setIsLoading(false);
    };

    const inputStyle = { 
        width: '100%', 
        backgroundColor: 'rgba(15, 23, 42, 0.5)', 
        color: '#f8fafc', 
        padding: '16px', 
        borderRadius: '12px', 
        border: '1px solid rgba(148, 163, 184, 0.1)', 
        boxSizing: 'border-box',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
    };

    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' };

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
                <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-1px' }}>College Structure Hub</h2>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px' }}>Design and manage the core academic architecture.</p>
            </motion.div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }}>
                
                {/* Form */}
                <motion.div style={glassCardStyle} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Configure Sections</h3>
                    </div>
                    
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Department Node</label>
                                <select value={department} onChange={(e) => setDepartment(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}>
                                    {departments.map(d => <option key={d} value={d} style={{ background: '#0f172a' }}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Academic Year</label>
                                <select value={year} onChange={(e) => setYear(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}>
                                    {years.map(y => <option key={y} value={y} style={{ background: '#0f172a' }}>Year {y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Allocated Sections (A, B, C)</label>
                            <input 
                                type="text" 
                                value={sections} 
                                onChange={(e) => setSections(e.target.value)} 
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'} 
                                onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.1)'}
                                placeholder="E.g. A, B, C, D"
                                required
                            />
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
                            whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" disabled={isLoading} 
                            style={{ 
                                width: '100%', background: 'linear-gradient(90deg, #2563eb, #4f46e5)', color: '#fff', 
                                padding: '16px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', border: 'none', 
                                cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '8px', opacity: isLoading ? 0.7 : 1,
                                transition: 'all 0.3s ease', letterSpacing: '0.5px'
                            }}
                        >
                            {isLoading ? 'Synchronizing...' : 'Deploy Architecture'}
                        </motion.button>
                    </form>
                </motion.div>

                {/* List */}
                <motion.div style={glassCardStyle} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(167, 139, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Active Topologies</h3>
                    </div>

                    {(!Array.isArray(structures) || structures.length === 0) ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', border: '2px dashed rgba(148, 163, 184, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                            </div>
                            <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>No academic topologies mapped yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                            <AnimatePresence>
                                {structures.map((s, index) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={s._id} 
                                        style={{ 
                                            background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '16px', 
                                            border: '1px solid rgba(255, 255, 255, 0.03)', display: 'flex', justifyContent: 'space-between', 
                                            alignItems: 'center', transition: 'all 0.3s ease' 
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.03)'; }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ fontWeight: '800', fontSize: '20px', color: '#fff', letterSpacing: '-0.5px' }}>{s.department}</div>
                                                <div style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Year {s.year}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                                                {s.sections.map(sec => (
                                                    <span key={sec} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#e2e8f0', border: '1px solid #475569' }}>
                                                        {sec}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
};

export default CollegeStructureManager;
