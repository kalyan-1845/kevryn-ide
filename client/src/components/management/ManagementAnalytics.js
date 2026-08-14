import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaChartLine, FaUsers, FaChalkboardTeacher, FaDesktop } from 'react-icons/fa';

const ManagementAnalytics = ({ token }) => {
    const [stats, setStats] = useState({
        totalStudents: '...',
        totalFaculty: '...',
        sessionsToday: '...',
        platformUtilization: '...'
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const API_BASE = process.env.REACT_APP_SERVER_URL || '';
                const res = await axios.get(`${API_BASE}/api/timetable/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats({
                    totalStudents: res.data.totalStudents || 0,
                    totalFaculty: res.data.totalFaculty || 0,
                    sessionsToday: res.data.sessionsToday || 0,
                    platformUtilization: res.data.platformUtilization || '0%'
                });
            } catch (err) {
                console.error("Failed to load analytics:", err);
            }
        };
        fetchAnalytics();
    }, [token]);

    const containerStyle = { padding: '40px', maxWidth: '1200px', margin: '0 auto' };
    const cardStyle = {
        background: '#ffffff', borderRadius: '16px', padding: '24px',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column'
    };

    const statCards = [
        { title: 'Total Students', value: stats.totalStudents, icon: <FaUsers size={24} color="#3b82f6" />, bg: '#eff6ff' },
        { title: 'Faculty Members', value: stats.totalFaculty, icon: <FaChalkboardTeacher size={24} color="#8b5cf6" />, bg: '#f5f3ff' },
        { title: 'Lab Sessions Today', value: stats.sessionsToday, icon: <FaDesktop size={24} color="#10b981" />, bg: '#ecfdf5' },
        { title: 'Platform Utilization (Today)', value: stats.platformUtilization, icon: <FaChartLine size={24} color="#f59e0b" />, bg: '#fffbeb' }
    ];

    return (
        <div style={containerStyle}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 12px 0', color: '#0f172a', letterSpacing: '-1px' }}>Global Analytics</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: '16px', maxWidth: '600px', lineHeight: '1.5' }}>
                    Real-time oversight of institutional operations, lab utilization, and engagement.
                </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {statCards.map((stat, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', background: stat.bg }}>{stat.icon}</div>
                        </div>
                        <h3 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 4px 0', color: '#0f172a' }}>{stat.value}</h3>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: '600' }}>{stat.title}</p>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div style={{ ...cardStyle, minHeight: '400px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px 0' }}>Weekly Lab Utilization</h3>
                    <div style={{ flex: 1, border: '1px dashed #cbd5e1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                        <p style={{ color: '#94a3b8', fontWeight: '500' }}>Chart Module Loading...</p>
                    </div>
                </div>
                <div style={{ ...cardStyle, minHeight: '400px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px 0' }}>Recent Activity</h3>
                    <div style={{ flex: 1, border: '1px dashed #cbd5e1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                        <p style={{ color: '#94a3b8', fontWeight: '500' }}>Activity Feed Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagementAnalytics;
