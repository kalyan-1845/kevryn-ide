import React from 'react';
import { FaTrophy, FaMedal, FaStar, FaGlobeAmericas, FaCode, FaLock } from 'react-icons/fa';

const CodingArena = () => {
    return (
        <div style={{ padding: '40px', background: '#020617', minHeight: '100%', color: '#f8fafc', overflowY: 'auto' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1 style={{ 
                            fontSize: '36px', 
                            fontWeight: '900', 
                            margin: 0, 
                            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', 
                            WebkitBackgroundClip: 'text', 
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-1px'
                        }}>
                            Global Coding Arena
                        </h1>
                        <div style={{ 
                            background: 'rgba(236, 72, 153, 0.1)', 
                            border: '1px solid rgba(236, 72, 153, 0.4)', 
                            color: '#ec4899', 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '800',
                            letterSpacing: '1px',
                            boxShadow: '0 0 15px rgba(236, 72, 153, 0.2)',
                            animation: 'pulse 2s infinite'
                        }}>
                            COMING SOON
                        </div>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '10px', maxWidth: '600px', lineHeight: '1.6' }}>
                        The ultimate competitive programming infrastructure. Host strict-proctored, full-screen hackathons and algorithmic contests across institutions with real-time global leaderboards.
                    </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '15px' }}>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '12px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FaGlobeAmericas color="#60a5fa" size={20} style={{ marginBottom: '5px' }} />
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>NETWORK</span>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#e2e8f0' }}>5+ Colleges</span>
                    </div>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '12px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FaCode color="#a855f7" size={20} style={{ marginBottom: '5px' }} />
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>CONTESTS</span>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#e2e8f0' }}>V 2.0</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '30px' }}>
                
                {/* Left Column: Contests */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaStar color="#fbbf24" /> Upcoming Championships
                    </h2>
                    
                    {[
                        { title: "Kevryn Inter-College Hackathon 2026", time: "Starts in 14 Days", pool: "$5,000 Prize Pool", type: "Strict Proctoring" },
                        { title: "Weekly Algorithmic Challenge #42", time: "Starts in 2 Days", pool: "Global Rating Points", type: "Standard" }
                    ].map((contest, idx) => (
                        <div key={idx} style={{ 
                            background: 'linear-gradient(145deg, #0f172a 0%, #020617 100%)',
                            border: '1px solid #1e293b',
                            borderRadius: '16px',
                            padding: '24px',
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: 0.7,
                            filter: 'grayscale(0.5)'
                        }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '30px', background: 'radial-gradient(circle at top right, rgba(168,85,247,0.1), transparent 70%)', width: '100%', height: '100%', pointerEvents: 'none' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ec4899', marginBottom: '8px', letterSpacing: '1px' }}>{contest.time}</div>
                                    <h3 style={{ fontSize: '22px', margin: '0 0 10px 0', color: '#fff' }}>{contest.title}</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <span style={{ fontSize: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)' }}>
                                            {contest.pool}
                                        </span>
                                        <span style={{ fontSize: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                            {contest.type}
                                        </span>
                                    </div>
                                </div>
                                <button disabled style={{ 
                                    background: '#334155', 
                                    border: 'none', 
                                    color: '#94a3b8', 
                                    padding: '10px 24px', 
                                    borderRadius: '8px', 
                                    fontWeight: 'bold', 
                                    cursor: 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <FaLock size={12} /> REGISTER
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Column: Global Leaderboard */}
                <div>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaTrophy color="#fbbf24" /> Global Leaderboard
                            </h2>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Season 1</span>
                        </div>
                        
                        <div style={{ padding: '10px' }}>
                            {[
                                { rank: 1, name: "Siddharth R.", college: "ACE Engineering College", rating: 2840, icon: <FaMedal color="#fbbf24" size={18} /> },
                                { rank: 2, name: "Priya M.", college: "CBIT Hyderabad", rating: 2795, icon: <FaMedal color="#94a3b8" size={18} /> },
                                { rank: 3, name: "Rahul K.", college: "VNR VJIET", rating: 2710, icon: <FaMedal color="#b45309" size={18} /> },
                                { rank: 4, name: "Ananya S.", college: "ACE Engineering College", rating: 2688, icon: <span style={{ width: '18px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>4</span> },
                                { rank: 5, name: "Vikram V.", college: "JNTUH", rating: 2650, icon: <span style={{ width: '18px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>5</span> },
                            ].map((user, idx) => (
                                <div key={idx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '12px', 
                                    borderRadius: '8px',
                                    background: idx === 0 ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                                    marginBottom: '4px',
                                    transition: 'background 0.2s'
                                }}>
                                    <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                                        {user.icon}
                                    </div>
                                    <div style={{ flex: 1, marginLeft: '10px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: idx === 0 ? '#fbbf24' : '#e2e8f0' }}>{user.name}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{user.college}</div>
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#a855f7' }}>
                                        {user.rating}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{ padding: '15px', borderTop: '1px solid #1e293b', textAlign: 'center' }}>
                            <button disabled style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: 'bold', cursor: 'not-allowed' }}>
                                View Full Rankings (Locked)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(236, 72, 153, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
                }
            `}</style>
        </div>
    );
};

export default CodingArena;
