import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaTimes, FaGithub, FaHackerrank, FaStar, 
    FaMedal, FaExternalLinkAlt, FaSpinner, FaTrophy, FaCode, FaSyncAlt
} from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';

const DeveloperProfileModal = ({ identifier, onClose, token, serverUrl }) => {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);

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

    useEffect(() => {
        if (identifier) fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identifier, token, serverUrl]);

    const handleForceSync = async () => {
        try {
            setSyncing(true);
            const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });
            await api.post(`/api/tracking/${identifier}/sync`);
            // Refetch after sync
            const res = await api.get(`/api/tracking/${identifier}`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to sync", err);
            alert("Failed to force sync data. Please try again.");
        } finally {
            setSyncing(false);
        }
    };

    // --- Styles ---
    const overlayStyle = {
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
    };

    const modalStyle = {
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: '90vh',
        overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc', padding: '32px', fontFamily: "'Outfit', sans-serif"
    };

    const sectionStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px', padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '24px', position: 'relative', overflow: 'hidden'
    };

    const circleStyle = (color) => ({
        width: '80px', height: '80px', borderRadius: '50%',
        border: `4px solid ${color}`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.2)', boxShadow: `0 0 15px ${color}40`
    });

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Never';
        const ms = new Date() - new Date(dateStr);
        const mins = Math.floor(ms / 60000);
        if (mins < 60) return `${mins} mins ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hrs ago`;
        return `${Math.floor(hrs / 24)} days ago`;
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', gap: '20px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <FaSpinner size={40} color="#8b5cf6" />
                    </motion.div>
                    <div style={{ color: '#94a3b8', fontSize: '16px', letterSpacing: '1px' }}>Loading Developer Blueprint...</div>
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

        const { user, github, leetcode, hackerrank, codechef, lastSyncedAt } = data;

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: github?.data?.avatarUrl ? `url(${github.data.avatarUrl}) center/cover` : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                            {!github?.data?.avatarUrl && (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800' }}>{user?.name || identifier}</h2>
                            <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '14px' }}>
                                <span>Roll No: <strong style={{ color: '#fff' }}>{user?.rollNumber || 'N/A'}</strong></span>
                                <span>Role: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{user?.role || 'Student'}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Last Synced: {formatTimeAgo(lastSyncedAt)}</span>
                        <button 
                            onClick={handleForceSync} 
                            disabled={syncing}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: syncing ? '#475569' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: syncing ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                        >
                            <motion.div animate={syncing ? { rotate: 360 } : {}} transition={syncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}>
                                <FaSyncAlt size={14} />
                            </motion.div>
                            {syncing ? 'Syncing Live...' : 'Force Live Sync'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                    
                    {/* LEFT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* GitHub Stats */}
                        <div style={sectionStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <FaGithub size={24} color="#fff" />
                                    <h3 style={{ margin: 0, fontSize: '20px' }}>GitHub</h3>
                                </div>
                                {github?.data?.isValid === false && <span style={{ color: '#ef4444', fontSize: '12px' }}>{github.error}</span>}
                            </div>
                            
                            {github && github.username && github.data?.isValid ? (
                                <>
                                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Public Repos</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{github.data.publicReposCount}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Stars</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{github.data.totalStars}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Followers</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{github.data.followers}</div>
                                        </div>
                                    </div>
                                    
                                    {github.data.topLanguages && github.data.topLanguages.length > 0 && (
                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', fontWeight: '600' }}>Top Languages:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {github.data.topLanguages.map(l => (
                                                    <span key={l.language} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px', color: '#e2e8f0' }}>
                                                        {l.language} ({l.count})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', fontWeight: '600' }}>All Repositories:</div>
                                        <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {github.data.repos?.map(repo => (
                                                <a key={repo.name} href={repo.url} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textDecoration: 'none', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{repo.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{repo.language || 'N/A'}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>
                                                        <FaStar size={12} /> {repo.stars}
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : <div style={{ color: '#64748b' }}>No valid GitHub profile connected.</div>}
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* LeetCode Stats */}
                        <div style={{...sectionStyle, background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(245, 158, 11, 0.02))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <SiLeetcode size={24} color="#f59e0b" />
                                <h3 style={{ margin: 0, fontSize: '20px' }}>LeetCode</h3>
                            </div>
                            {leetcode && leetcode.username && leetcode.data?.isValid ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Contest Rating</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{leetcode.data.contestRating || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Global Ranking</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>#{leetcode.data.ranking?.toLocaleString() || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{leetcode.data.solved?.easy || 0}</div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Easy</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>{leetcode.data.solved?.medium || 0}</div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Medium</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{leetcode.data.solved?.hard || 0}</div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Hard</div>
                                        </div>
                                    </div>

                                    {leetcode.data.recentSubmissions && leetcode.data.recentSubmissions.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', fontWeight: '600' }}>Recent Submissions:</div>
                                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
                                                {leetcode.data.recentSubmissions.map((sub, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${sub.statusDisplay === 'Accepted' ? '#10b981' : '#ef4444'}` }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{sub.title}</div>
                                                        <div style={{ fontSize: '11px', color: sub.statusDisplay === 'Accepted' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{sub.statusDisplay}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : <div style={{ color: '#64748b' }}>No valid LeetCode profile connected.</div>}
                        </div>

                        {/* CodeChef & HackerRank (Split) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {/* CodeChef Stats */}
                            <div style={sectionStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <FaCode size={20} color="#8b5cf6" />
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>CodeChef</h3>
                                </div>
                                {codechef && codechef.username && codechef.data?.isValid ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Rating</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                                                {codechef.data.rating || 'N/A'} <span style={{fontSize: '12px', color: '#fbbf24'}}>{codechef.data.stars}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Global</div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e2e8f0' }}>#{codechef.data.globalRank || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Country</div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>#{codechef.data.countryRank || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : <div style={{ color: '#64748b', fontSize: '13px' }}>Not connected.</div>}
                            </div>

                            {/* HackerRank Stats */}
                            <div style={sectionStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <FaHackerrank size={20} color="#10b981" />
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>HackerRank</h3>
                                </div>
                                {hackerrank && hackerrank.username && hackerrank.data?.isValid ? (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Badges</div>
                                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
                                                {hackerrank.data.badges?.length || 0}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {hackerrank.data.badges?.map((badge, idx) => (
                                                <div key={idx} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                                    <FaMedal color="#fbbf24" size={12} />
                                                    {badge.title} ({badge.stars})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : <div style={{ color: '#64748b', fontSize: '13px' }}>Not connected.</div>}
                            </div>
                        </div>

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
