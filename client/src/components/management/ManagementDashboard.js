import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBuilding, FaUsers, FaClock, FaSignOutAlt, FaCrown } from 'react-icons/fa';
import ParticleBackground from '../ParticleBackground';
import CollegeStructureManager from './CollegeStructureManager';
import StudentOnboarding from './StudentOnboarding';
import TimetableManager from './TimetableManager';

const ManagementDashboard = ({ token, onLogout, userRole }) => {
    const [activeTab, setActiveTab] = useState('structure');

    const sidebarStyle = {
        width: '280px',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)'
    };

    const getTabStyle = (id) => ({
        width: '100%', display: 'flex', alignItems: 'center', gap: '14px', 
        padding: '16px 20px', borderRadius: '12px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        border: '1px solid',
        borderColor: activeTab === id ? 'rgba(139, 92, 246, 0.5)' : 'transparent',
        cursor: 'pointer', 
        background: activeTab === id ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent', 
        color: activeTab === id ? '#fff' : '#94a3b8', 
        boxShadow: activeTab === id ? '0 4px 20px rgba(139, 92, 246, 0.15), inset 0 0 10px rgba(59, 130, 246, 0.1)' : 'none',
        fontWeight: activeTab === id ? '600' : '500',
        letterSpacing: '0.5px'
    });

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #0f172a 100%)', color: '#fff', display: 'flex', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <ParticleBackground />
            
            {/* Premium Sidebar */}
            <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} style={sidebarStyle}>
                <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}>
                                <FaCrown size={20} color="#fff" />
                            </div>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', backgroundImage: 'linear-gradient(to right, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', color: 'transparent', margin: 0, letterSpacing: '-0.5px' }}>
                                Apex Portal
                            </h1>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>ACEEN-A5EC Management</p>
                    </motion.div>
                </div>

                <nav style={{ flex: 1, marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 20px' }}>
                    {[
                        { id: 'structure', icon: <FaBuilding size={18} />, label: 'College Structure' },
                        { id: 'students', icon: <FaUsers size={18} />, label: 'Student Directory' },
                        { id: 'timetable', icon: <FaClock size={18} />, label: 'Timetable Manager' }
                    ].map((tab, index) => (
                        <motion.button 
                            key={tab.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + (index * 0.1) }}
                            onClick={() => setActiveTab(tab.id)} 
                            style={getTabStyle(tab.id)}
                            whileHover={{ scale: 1.02, background: activeTab === tab.id ? undefined : 'rgba(255,255,255,0.03)' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span style={{ color: activeTab === tab.id ? '#a78bfa' : '#64748b', transition: 'color 0.3s' }}>{tab.icon}</span> 
                            {tab.label}
                        </motion.button>
                    ))}
                </nav>

                <div style={{ padding: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0,0,0,0.2)' }}>
                    <motion.button 
                        whileHover={{ scale: 1.02, background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onLogout} 
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', color: '#fca5a5', border: '1px solid transparent', backgroundColor: 'rgba(239, 68, 68, 0.05)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}
                    >
                        <FaSignOutAlt /> Secure Sign Out
                    </motion.button>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10, height: '100vh', padding: '40px' }}>
                <AnimatePresence mode='wait'>
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                        style={{ maxWidth: '1400px', margin: '0 auto', height: '100%' }}
                    >
                        {activeTab === 'structure' && <CollegeStructureManager token={token} />}
                        {activeTab === 'students' && <StudentOnboarding token={token} />}
                        {activeTab === 'timetable' && <TimetableManager token={token} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManagementDashboard;
