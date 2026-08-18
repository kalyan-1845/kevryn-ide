import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaTimes, FaGithub, FaHackerrank, FaStar, 
    FaMedal, FaExternalLinkAlt, FaSpinner, FaTrophy, FaCode
} from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';

const DeveloperProfileModal = ({ identifier, onClose, token, serverUrl }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });
                const res = await api.get(`/api/tracking/${identifier}`);
                setData(res.data);
                setError('');
            } catch (err) {
                console.error("Failed to fetch developer profile", err);
                setError('Failed to fetch developer profile data.');
            } finally {
                setLoading(false);
            }
        };
        if (identifier) fetchProfile();
    }, [identifier, token, serverUrl]);

    // --- Styles ---
    const overlayStyle = {
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
    };

    const modalStyle = {
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh',
        overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc', padding: '32px', fontFamily: "'Outfit', sans-serif"
    };

    const sectionStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px', padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '24px'
    };

    const circleStyle = (color) => ({
        width: '80px', height: '80px', borderRadius: '50%',
        border: `4px solid ${color}`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.2)', boxShadow: `0 0 15px ${color}40`
    });

    const renderContent = () => {
        if (loading) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '20px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <FaSpinner size={40} color="#8b5cf6" />
                    </motion.div>
                    <div style={{ color: '#94a3b8', fontSize: '16px', letterSpacing: '1px' }}>Tracking Developer Footprint...</div>
                </div>
            );
        }

        if (error || !data) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
                    <p>{error || 'Profile not found.'}</p>
                </div>
            );
        }

        const { user, github, leetcode, hackerrank, codechef } = data;

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800' }}>{user?.name || identifier}</h2>
                        <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '14px' }}>
                            <span>Roll No: <strong style={{ color: '#fff' }}>{user?.rollNumber || 'N/A'}</strong></span>
                            <span>Role: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{user?.role || 'Student'}</strong></span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    
                    {/* GitHub Stats */}
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <FaGithub size={24} color="#fff" />
                            <h3 style={{ margin: 0, fontSize: '20px' }}>GitHub</h3>
                        </div>
                        {github ? (
                            <>
                                <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Public Repos</div>
                                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{github.public_repos}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Followers</div>
                                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{github.followers}</div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>Recent Repositories:</div>
                                    {github.recent_repos?.map(repo => (
                                        <a key={repo.name} href={repo.url} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textDecoration: 'none', color: '#e2e8f0', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontWeight: '600' }}>{repo.name}</span>
                                            <FaExternalLinkAlt size={12} color="#64748b" />
                                        </a>
                                    ))}
                                </div>
                            </>
                        ) : <div style={{ color: '#64748b' }}>No GitHub profile connected.</div>}
                    </div>

                    {/* LeetCode Stats */}
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <SiLeetcode size={24} color="#f59e0b" />
                            <h3 style={{ margin: 0, fontSize: '20px' }}>LeetCode</h3>
                        </div>
                        {leetcode ? (
                            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingTop: '10px' }}>
                                <div style={circleStyle('#10b981')}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{leetcode.easySolved}</span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Easy</span>
                                </div>
                                <div style={circleStyle('#f59e0b')}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{leetcode.mediumSolved}</span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Medium</span>
                                </div>
                                <div style={circleStyle('#ef4444')}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{leetcode.hardSolved}</span>
                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Hard</span>
                                </div>
                            </div>
                        ) : <div style={{ color: '#64748b' }}>No LeetCode profile connected.</div>}
                    </div>

                    {/* HackerRank Stats */}
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <FaHackerrank size={24} color="#10b981" />
                            <h3 style={{ margin: 0, fontSize: '20px' }}>HackerRank</h3>
                        </div>
                        {hackerrank ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Badges Earned</div>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        {hackerrank.badges?.length || 0}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {hackerrank.badges?.map((badge, idx) => (
                                        <div key={idx} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                            <FaMedal color="#fbbf24" />
                                            {badge.badge_name} ({badge.stars} <FaStar size={10} color="#fbbf24" />)
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <div style={{ color: '#64748b' }}>No HackerRank profile connected.</div>}
                    </div>

                    {/* CodeChef Stats */}
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <FaCode size={24} color="#8b5cf6" />
                            <h3 style={{ margin: 0, fontSize: '20px' }}>CodeChef</h3>
                        </div>
                        {codechef ? (
                            <div style={{ display: 'flex', gap: '32px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Global Rank</div>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FaTrophy size={20} />
                                        {codechef.globalRank || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Country Rank</div>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                                        {codechef.countryRank || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Rating</div>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                                        {codechef.rating || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        ) : <div style={{ color: '#64748b' }}>No CodeChef profile connected.</div>}
                    </div>

                </div>
            </motion.div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlayStyle}>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={modalStyle}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <FaTimes size={24} />
                    </button>
                    {renderContent()}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DeveloperProfileModal;
