import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBuilding, FaCalendarAlt, FaBookOpen, FaChartLine, FaSignOutAlt, FaCube } from 'react-icons/fa';

import InstitutionSetup from './InstitutionSetup';
import TimetableScheduler from './TimetableScheduler';
import AcademicConfig from './AcademicConfig';
import ManagementAnalytics from './ManagementAnalytics';

const ManagementDashboard = ({ token, onLogout }) => {
    const [activeTab, setActiveTab] = useState('setup');

    // Subtle grid background (SaaS aesthetic)
    const backgroundStyle = {
        minHeight: '100vh',
        backgroundColor: '#fafbfc',
        backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px), 
                          linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        color: '#0f172a',
        display: 'flex',
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
    };

    const sidebarStyle = {
        width: '280px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
    };

    const getTabStyle = (id) => ({
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '14px', 
        padding: '14px 20px', 
        borderRadius: '12px', 
        transition: 'all 0.2s ease', 
        border: 'none',
        cursor: 'pointer', 
        background: activeTab === id ? '#f0f5ff' : 'transparent', 
        color: activeTab === id ? '#4f46e5' : '#64748b', 
        fontWeight: activeTab === id ? '600' : '500',
        fontSize: '15px',
        boxShadow: activeTab === id ? 'inset 4px 0 0 #4f46e5' : 'none'
    });

    return (
        <div style={backgroundStyle}>
            {/* Sidebar */}
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} style={sidebarStyle}>
                <div style={{ padding: '32px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)' }}>
                            <FaCube size={20} color="#fff" />
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
                            Kevryn.OS
                        </h1>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', paddingLeft: '44px' }}>
                        ACEEN-A5EC Admin
                    </p>
                </div>

                <nav style={{ flex: 1, marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
                    {[
                        { id: 'setup', icon: <FaBuilding size={18} />, label: 'Institution Setup' },
                        { id: 'timetable', icon: <FaCalendarAlt size={18} />, label: 'Master Timetable' },
                        { id: 'academic', icon: <FaBookOpen size={18} />, label: 'Academic Config' },
                        { id: 'analytics', icon: <FaChartLine size={18} />, label: 'Global Analytics' }
                    ].map((tab) => (
                        <motion.button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)} 
                            style={getTabStyle(tab.id)}
                            whileHover={{ scale: 1.01, background: activeTab === tab.id ? '#f0f5ff' : '#f8fafc' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span style={{ transition: 'color 0.2s' }}>{tab.icon}</span> 
                            {tab.label}
                        </motion.button>
                    ))}
                </nav>

                <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                    <motion.button 
                        whileHover={{ scale: 1.02, background: '#fee2e2', color: '#dc2626' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onLogout} 
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', color: '#ef4444', border: '1px solid #fecaca', backgroundColor: '#fef2f2', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600', fontSize: '14px' }}
                    >
                        <FaSignOutAlt /> Sign Out
                    </motion.button>
                </div>
            </motion.div>

            {/* Main Workspace */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative', height: '100vh' }}>
                <AnimatePresence mode='wait'>
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={{ maxWidth: '1400px', margin: '0 auto', minHeight: '100%' }}
                    >
                        {activeTab === 'setup' && <InstitutionSetup token={token} />}
                        {activeTab === 'timetable' && <TimetableScheduler token={token} />}
                        {activeTab === 'academic' && <AcademicConfig token={token} />}
                        {activeTab === 'analytics' && <ManagementAnalytics token={token} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManagementDashboard;

