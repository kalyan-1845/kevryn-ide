
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserShield, FaUsers, FaChartPie, FaExclamationCircle, FaSearch, FaCode, FaSignOutAlt, FaRocket, FaClock, FaBuilding, FaPlus, FaCopy, FaTrashAlt, FaBullhorn, FaPaperPlane, FaVolumeUp } from 'react-icons/fa';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ParticleBackground from './ParticleBackground';

// --- STYLES & ANIMATIONS ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const dashboardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
};

const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

const AdminDashboard = ({ token, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        userCounts: [], activeSessions: 0, recentIssues: 0, registrationTrend: []
    });
    const [users, setUsers] = useState([]);
    const [issues, setIssues] = useState([]);
    const [colleges, setColleges] = useState([]); // NEW: Colleges State
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showCreateCollege, setShowCreateCollege] = useState(false); // NEW: College Modal
    const [newCollegeName, setNewCollegeName] = useState("");
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [createUserForm, setCreateUserForm] = useState({ username: '', password: '', role: 'student', collegeId: '' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [broadcastsList, setBroadcastsList] = useState([]);
    const [broadcastForm, setBroadcastForm] = useState({
        title: '',
        message: '',
        collegeId: '',
        targetRole: 'all',
        priority: 'normal'
    });
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

    // API Instance
    const api = axios.create({
        baseURL: (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim().startsWith('http')
            ? (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim()
            : `https://${(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim()}`,
        headers: { Authorization: token }
    });

    // Fetch Data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, issuesRes] = await Promise.all([
                api.get('/api/admin/analytics'),
                api.get('/api/admin/issues')
            ]);
            console.log("Stats Data:", statsRes.data); // Debug

            // Validate Data Structures to prevent crashes
            const safeStats = {
                userCounts: statsRes.data.userCounts || [],
                activeSessions: statsRes.data.activeSessions || 0,
                recentIssues: statsRes.data.recentIssues || 0,
                registrationTrend: statsRes.data.registrationTrend || []
            };

            setStats(safeStats);
            setIssues(issuesRes.data || []);
        } catch (e) {
            console.error("Failed to fetch admin data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get(`/api/admin/users?search=${searchQuery}`);
            setUsers(res.data);
        } catch (e) { console.error("User fetch failed", e); }
    };

    const fetchColleges = async () => {
        try {
            const res = await api.get('/api/admin/colleges');
            setColleges(res.data);
        } catch (e) { console.error("Colleges fetch failed", e); }
    };

    const fetchBroadcasts = async () => {
        try {
            const res = await api.get('/api/admin/broadcasts');
            setBroadcastsList(res.data || []);
        } catch (e) { console.error("Broadcast fetch failed", e); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!createUserForm.username || !createUserForm.password) return alert("Username and Password required");
        setIsCreatingUser(true);
        try {
            await api.post('/api/admin/create-user', createUserForm);
            alert("User created successfully!");
            setCreateUserForm({ username: '', password: '', role: 'student', collegeId: '' });
            setShowCreateUser(false);
            fetchUsers();
        } catch (err) {
            alert("Failed to create user: " + (err.response?.data?.error || err.message));
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastForm.message.trim()) {
            alert("Please enter a broadcast message.");
            return;
        }
        setIsSendingBroadcast(true);
        try {
            const currentUserEmail = (localStorage.getItem('email') || '').toLowerCase().trim();
            const currentUsername = (localStorage.getItem('username') || '').toLowerCase().trim();
            let creatorName = "Admin";
            if (currentUserEmail.includes('prsnlkalyan') || currentUsername.includes('kalyan')) {
                creatorName = "Bhoompally Kalyan Reddy (Founder & CEO)";
            } else if (currentUserEmail.includes('raviraj') || currentUsername.includes('raviraj')) {
                creatorName = "Javvadi Ravi Raj (Founder & CTO)";
            }

            await api.post('/api/admin/broadcast', {
                ...broadcastForm,
                title: 'Direct Message', // Default title explicitly provided
                createdByName: creatorName
            });

            alert("🚀 Broadcast Published Live! All targeted logged-in users will receive the top banner notice in < 2 seconds.");
            setBroadcastForm({ title: '', message: '', collegeId: '', targetRole: 'all', priority: 'normal' });
            fetchBroadcasts();
        } catch (err) {
            alert("Failed to send broadcast: " + (err.response?.data?.error || err.message));
        } finally {
            setIsSendingBroadcast(false);
        }
    };

    const handleDismissBroadcast = async (id) => {
        try {
            await api.delete(`/api/admin/broadcasts/${id}`);
            fetchBroadcasts();
        } catch (err) {
            console.error("Dismiss failed", err);
        }
    };

    const handleCreateCollege = async () => {
        if (!newCollegeName.trim()) return;
        try {
            await api.post('/api/admin/colleges', { name: newCollegeName });
            setNewCollegeName("");
            setShowCreateCollege(false);
            fetchColleges();
            alert("College Created Successfully!");
        } catch (e) { alert("Failed to create college: " + e.message); }
    };

    const toggleCollegeStatus = async (id, currentStatus) => {
        try {
            await api.patch(`/api/admin/colleges/${id}`, { isActive: !currentStatus });
            fetchColleges();
        } catch (e) { alert(e.message); }
    };

    useEffect(() => {
        // Initial Load
        fetchData();

        // Welcome Animation Timer
        const timer = setTimeout(() => setShowWelcome(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (activeTab === 'overview') fetchData();
        if (activeTab === 'users') {
            fetchUsers();
            fetchColleges(); // Fix: Needed for the Create Account dropdown
        }
        if (activeTab === 'issues') fetchData();
        if (activeTab === 'colleges') fetchColleges();
        if (activeTab === 'broadcast') fetchBroadcasts();
    }, [activeTab, searchQuery]);

    const toggleFacultyStatus = async (userId, currentStatus) => {
        try {
            await api.patch(`/api/admin/users/${userId}/status`, { isFacultyActive: !currentStatus });
            fetchUsers();
        } catch (e) { alert(e.message); }
    };

    const changeUserRole = async (userId, newRole) => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
        try {
            await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
            fetchUsers();
            fetchData(); // Refresh stats too
        } catch (e) { alert(e.message); }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`CRITICAL WARNING: Are you sure you want to PERMANENTLY delete user "${username}" and ALL their associated data? This cannot be undone.`)) return;
        
        try {
            await api.delete(`/api/admin/users/${userId}`);
            fetchUsers();
            fetchData(); // Refresh stats
            alert(`User ${username} deleted successfully.`);
        } catch (e) { 
            alert("Failed to delete user: " + (e.response?.data?.message || e.response?.data?.error || e.message)); 
        }
    };

    // --- RENDER ---
    return (
        <div style={{
            width: '100vw', height: '100vh',
            background: '#050505', color: '#e0e0e0',
            fontFamily: "'Rajdhani', sans-serif", overflow: 'hidden',
            display: 'flex', position: 'relative'
        }}>
            {isLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(5,5,5,0.85)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '16px'
                }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: '3px solid rgba(0, 212, 255, 0.2)',
                        borderTop: '3px solid #00d4ff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }} />
                    <div style={{ color: '#00d4ff', fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>INITIALIZING COMMAND CENTER...</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}
            <style>{`
                .hover-row:hover {
                    background: rgba(0, 212, 255, 0.05);
                    box-shadow: inset 2px 0 0 #00d4ff;
                }
                .glitch-btn {
                    transition: all 0.3s ease;
                }
                .glitch-btn:hover {
                    box-shadow: 0 0 15px rgba(255, 77, 77, 0.6);
                    transform: translateY(-2px);
                }
                .cyber-input {
                    background: rgba(0,0,0,0.5);
                    border: 1px solid #333;
                    color: #fff;
                    transition: all 0.3s;
                }
                .cyber-input:focus {
                    border-color: #00d4ff;
                    box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
                    outline: none;
                }
            `}</style>
            <ParticleBackground />

            {/* WELCOME OVERLAY */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, pointerEvents: 'none' }}
                        transition={{ duration: 1 }}
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: '#000', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center',
                            flexDirection: 'column'
                        }}
                    >
                        <motion.h1
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{ fontSize: '80px', fontWeight: '900', color: '#fff', letterSpacing: '10px' }}
                        >
                            KEVRYN
                        </motion.h1>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '200px' }}
                            transition={{ delay: 0.5, duration: 1 }}
                            style={{ height: '4px', background: '#00d4ff', marginTop: '20px' }}
                        />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 1 }}
                            style={{ color: '#666', marginTop: '10px', letterSpacing: '5px' }}
                        >
                            ADMINISTRATION_SYSTEM_V.1.0
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <motion.div
                initial={{ x: -100 }} animate={{ x: 0 }} transition={{ delay: 2.5 }}
                style={{
                    width: '90px', height: '100%', borderRight: '1px solid rgba(0, 212, 255, 0.1)',
                    backdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.3)',
                    zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '30px', gap: '30px'
                }}
            >
                <div style={{ fontSize: '30px', color: '#00d4ff', marginBottom: '30px', filter: 'drop-shadow(0 0 10px #00d4ff)' }}><FaUserShield /></div>

                <SidebarIcon icon={<FaChartPie />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <SidebarIcon icon={<FaBuilding />} label="Colleges" active={activeTab === 'colleges'} onClick={() => setActiveTab('colleges')} />
                <SidebarIcon icon={<FaUsers />} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                <SidebarIcon icon={<FaExclamationCircle />} label="Issues" active={activeTab === 'issues'} onClick={() => setActiveTab('issues')} />
                <SidebarIcon icon={<FaBullhorn />} label="Broadcast" active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} />

                <div style={{ flex: 1 }} />
                <SidebarIcon icon={<FaSignOutAlt />} label="Logout" onClick={onLogout} color="#ff4d4d" />
            </motion.div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, zIndex: 10, overflowY: 'auto', padding: '40px' }}>
                {/* STYLISH HEADER */}
                {(() => {
                    const currentUserEmail = (localStorage.getItem('email') || '').toLowerCase().trim();
                    const currentUsername = (localStorage.getItem('username') || '').toLowerCase().trim();

                    let adminRoleTitle = "ADMINISTRATOR";
                    let adminDisplayName = "JAVVADI RAVI RAJ";

                    if (currentUserEmail === 'prsnlkalyan@gmail.com' || currentUserEmail.includes('prsnlkalyan') || currentUsername === 'prsnlkalyan' || currentUsername.includes('prsnlkalyan') || currentUsername === 'p kalyan reddy' || currentUsername.includes('kalyan') || currentUsername === 'prsnlkalyan@gmail.com') {
                        adminRoleTitle = "FOUNDER & CEO";
                        adminDisplayName = "Bhoompally Kalyan Reddy";
                    } else if (currentUserEmail.includes('raviraj') || currentUsername.includes('raviraj')) {
                        adminRoleTitle = "FOUNDER & CTO";
                        adminDisplayName = "Javvadi Ravi Raj";
                    } else {
                        const localName = localStorage.getItem('fullName') || localStorage.getItem('username');
                        if (localName && localName !== 'undefined') {
                            adminDisplayName = localName;
                        }
                    }

                    return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(0, 212, 255, 0.2)', paddingBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img src="/logo.png?v=4" alt="KevRyn Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.6))' }} />
                                <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '4px', color: '#00d4ff', textShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}>
                                    KEVRYN
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#00d4ff', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold' }}>
                                        {adminRoleTitle}
                                    </div>
                                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>
                                        {adminDisplayName}
                                    </div>
                                </div>
                                <div style={{
                                    width: '45px', height: '45px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00d4ff, #0088FE)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '20px', boxShadow: '0 0 15px rgba(0, 136, 254, 0.5)'
                                }}>
                                    <FaUserShield />
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <AnimatePresence mode="wait">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <motion.div key="overview" variants={dashboardVariants} initial="hidden" animate="visible">
                            <h2 style={headerStyle}>SYSTEM OVERVIEW</h2>

                            {/* POWER BI STYLE GRID */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '35px' }}>
                                <KPICard title="TOTAL USERS" value={stats.userCounts.reduce((a, b) => a + b.count, 0)} color="#0088FE" icon={<FaUsers />} />
                                <KPICard title="ACTIVE SESSIONS" value={stats.activeSessions} color="#00C49F" icon={<FaRocket />} />
                                <KPICard title="OPEN ISSUES" value={stats.recentIssues} color="#FF8042" icon={<FaExclamationCircle />} />
                                <KPICard title="UPTIME" value="99.9%" color="#FFBB28" icon={<FaClock />} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
                                <ChartCard title="REGISTRATION TREND (Last 7 Days)">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={stats.registrationTrend}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="_id" stroke="#666" />
                                            <YAxis stroke="#666" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="count" stroke="#00d4ff" fillOpacity={1} fill="url(#colorCount)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                <ChartCard title="USER DISTRIBUTION">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie data={stats.userCounts} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label>
                                                {stats.userCounts.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px', fontSize: '12px', color: '#aaa' }}>
                                        {stats.userCounts.map((entry, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <div style={{ width: '10px', height: '10px', background: COLORS[index % COLORS.length], borderRadius: '50%' }} />
                                                {(entry._id || 'Unknown').toUpperCase()}
                                            </div>
                                        ))}
                                    </div>
                                </ChartCard>
                            </div>
                        </motion.div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <motion.div key="users" variants={dashboardVariants} initial="hidden" animate="visible">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                                <div>
                                    <h2 style={headerStyle}>USER REGISTRY</h2>
                                    <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0' }}>Comprehensive User Directory & Multi-Tenancy Classification</p>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setShowCreateUser(true)}
                                        style={{
                                            background: 'linear-gradient(135deg, #00d4ff, #0088FE)',
                                            color: '#000', border: 'none', padding: '10px 20px',
                                            borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            boxShadow: '0 0 10px rgba(0, 212, 255, 0.4)'
                                        }}
                                    >
                                        <FaPlus /> Create Account
                                    </button>
                                    <div style={{ position: 'relative' }}>
                                        <FaSearch style={{ position: 'absolute', left: '15px', top: '12px', color: '#00d4ff' }} />
                                        <input
                                            type="text" placeholder="Search by Username, Email, College Code..."
                                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid #333', padding: '10px 10px 10px 40px',
                                            color: '#fff', borderRadius: '8px', width: '320px', outline: 'none',
                                            boxShadow: '0 0 10px rgba(0,0,0,0.5)', fontSize: '13px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CREATE USER MODAL */}
                            <AnimatePresence>
                                {showCreateUser && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{
                                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                            style={{
                                                background: '#1a1a1a', border: '1px solid #333',
                                                padding: '30px', borderRadius: '16px', width: '400px',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '20px' }}>Create New Account</h3>
                                            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <input
                                                    type="text" placeholder="Username" required
                                                    value={createUserForm.username}
                                                    onChange={e => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                                                    style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }}
                                                />
                                                <input
                                                    type="password" placeholder="Password" required
                                                    value={createUserForm.password}
                                                    onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                                                    style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }}
                                                />
                                                <select
                                                    value={createUserForm.role}
                                                    onChange={e => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                                                    style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }}
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="faculty">Faculty</option>
                                                    <option value="college_admin">College Admin</option>
                                                    <option value="admin">Super Admin</option>
                                                </select>
                                                <select
                                                    value={createUserForm.collegeId}
                                                    onChange={e => setCreateUserForm({ ...createUserForm, collegeId: e.target.value })}
                                                    style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }}
                                                >
                                                    <option value="">No College (Global)</option>
                                                    {colleges.map(c => (
                                                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                                                    ))}
                                                </select>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                    <button type="button" onClick={() => setShowCreateUser(false)} style={{ flex: 1, padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                                    <button type="submit" disabled={isCreatingUser} style={{ flex: 1, padding: '12px', background: '#00d4ff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        {isCreatingUser ? 'Creating...' : 'Create Account'}
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* CATEGORY FILTER PILLS */}
                            {(() => {
                                const aceCount = users.filter(u => {
                                    const cCode = (u.collegeId?.code || '').toUpperCase();
                                    const cName = (u.collegeId?.name || '').toUpperCase();
                                    return cCode.includes('ACE') || cName.includes('ACE');
                                }).length;
                                const collegeCount = users.filter(u => u.collegeId).length;
                                const personalCount = users.filter(u => !u.collegeId && u.role !== 'admin' && u.role !== 'faculty').length;
                                const facultyCount = users.filter(u => u.role === 'faculty').length;
                                const adminCount = users.filter(u => u.role === 'admin').length;

                                const filters = [
                                    { id: 'all', label: `ALL USERS (${users.length})`, icon: '⚡' },
                                    { id: 'ace', label: `ACE COLLEGE (${aceCount})`, icon: '🏫' },
                                    { id: 'college', label: `COLLEGE ENROLLED (${collegeCount})`, icon: '🏛️' },
                                    { id: 'personal', label: `PERSONAL / OTHER (${personalCount})`, icon: '🌐' },
                                    { id: 'faculty', label: `FACULTY (${facultyCount})`, icon: '👨‍🏫' },
                                    { id: 'admin', label: `FOUNDERS & ADMINS (${adminCount})`, icon: '🛡️' }
                                ];

                                return (
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
                                        {filters.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => setCategoryFilter(f.id)}
                                                style={{
                                                    background: categoryFilter === f.id ? 'linear-gradient(135deg, #00d4ff, #0088FE)' : 'rgba(255,255,255,0.04)',
                                                    color: categoryFilter === f.id ? '#000' : '#ccc',
                                                    fontWeight: categoryFilter === f.id ? '900' : '600',
                                                    border: categoryFilter === f.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                                    padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px',
                                                    letterSpacing: '0.5px', transition: 'all 0.2s ease',
                                                    boxShadow: categoryFilter === f.id ? '0 0 15px rgba(0,212,255,0.4)' : 'none'
                                                }}
                                            >
                                                <span style={{ marginRight: '6px' }}>{f.icon}</span>{f.label}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Glass Table */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(5px)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>
                                            <th style={{ padding: '20px' }}>User</th>
                                            <th>Role</th>
                                            <th>Institution / Code</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                            <th>Raw Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users
                                            .filter(user => {
                                                const q = searchQuery.toLowerCase().trim();
                                                const matchSearch = !q || (user.username && user.username.toLowerCase().includes(q)) ||
                                                                    (user.email && user.email.toLowerCase().includes(q)) ||
                                                                    (user.collegeId?.name && user.collegeId.name.toLowerCase().includes(q)) ||
                                                                    (user.collegeId?.code && user.collegeId.code.toLowerCase().includes(q));
                                                if (!matchSearch) return false;

                                                if (categoryFilter === 'all') return true;
                                                if (categoryFilter === 'ace') {
                                                    const cCode = (user.collegeId?.code || '').toUpperCase();
                                                    const cName = (user.collegeId?.name || '').toUpperCase();
                                                    return cCode.includes('ACE') || cName.includes('ACE');
                                                }
                                                if (categoryFilter === 'college') return !!user.collegeId;
                                                if (categoryFilter === 'personal') return !user.collegeId && user.role !== 'admin' && user.role !== 'faculty';
                                                if (categoryFilter === 'faculty') return user.role === 'faculty';
                                                if (categoryFilter === 'admin') return user.role === 'admin';
                                                return true;
                                            })
                                            .map(user => (
                                            <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: '0.2s' }} className="hover-row">
                                                <td style={{ padding: '20px', color: '#fff', fontWeight: 'bold' }}>{user.username}</td>
                                                <td>
                                                    {(() => {
                                                        const uEmail = (user.email || '').toLowerCase().trim();
                                                        const uName = (user.username || '').toLowerCase().trim();
                                                        const isKalyan = uEmail === 'prsnlkalyan@gmail.com' || uName === 'prsnlkalyan@gmail.com' || uName === 'prsnlkalyan';
                                                        const isRavi = uEmail === 'ravirajjavvadhi@gmail.com' || uName === 'ravirajjavvadhi@gmail.com' || uName === 'ravirajjavvadi';

                                                        if (isKalyan) {
                                                            return (
                                                                <span style={{
                                                                    background: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff',
                                                                    border: '1px solid #00d4ff', padding: '4px 10px',
                                                                    borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px'
                                                                }}>
                                                                    👑 FOUNDER & CEO
                                                                </span>
                                                            );
                                                        } else if (isRavi) {
                                                            return (
                                                                <span style={{
                                                                    background: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff',
                                                                    border: '1px solid #00d4ff', padding: '4px 10px',
                                                                    borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px'
                                                                }}>
                                                                    👑 FOUNDER & CTO
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <select
                                                                value={user.role || 'student'}
                                                                onChange={(e) => changeUserRole(user._id, e.target.value)}
                                                                style={{
                                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                                                                    background: user.role === 'admin' ? 'rgba(255, 77, 77, 0.2)' : user.role === 'college_admin' ? 'rgba(168, 85, 247, 0.2)' : user.role === 'faculty' ? 'rgba(0, 196, 159, 0.2)' : 'rgba(255,255,255,0.1)',
                                                                    color: user.role === 'admin' ? '#FF4D4D' : user.role === 'college_admin' ? '#c084fc' : user.role === 'faculty' ? '#00C49F' : '#aaa',
                                                                    border: `1px solid ${user.role === 'admin' ? '#FF4D4D' : user.role === 'college_admin' ? '#c084fc' : user.role === 'faculty' ? '#00C49F' : '#444'}`,
                                                                    outline: 'none', cursor: 'pointer', appearance: 'none',
                                                                    textTransform: 'uppercase'
                                                                }}
                                                            >
                                                                <option value="student" style={{ background: '#111', color: '#fff' }}>STUDENT</option>
                                                                <option value="faculty" style={{ background: '#111', color: '#fff' }}>FACULTY</option>
                                                                <option value="college_admin" style={{ background: '#111', color: '#fff' }}>COLLEGE ADMIN</option>
                                                                <option value="admin" style={{ background: '#111', color: '#fff' }}>ADMIN</option>
                                                            </select>
                                                        );
                                                    })()}
                                                </td>
                                                <td>
                                                    {user.collegeId ? (
                                                        <span style={{
                                                            background: 'rgba(0, 212, 255, 0.12)', color: '#00d4ff',
                                                            border: '1px solid rgba(0, 212, 255, 0.3)', padding: '4px 10px',
                                                            borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block'
                                                        }}>
                                                            🏫 {user.collegeId.name || 'College'} ({user.collegeId.code || 'N/A'})
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            background: 'rgba(255,255,255,0.04)', color: '#777',
                                                            border: '1px solid rgba(255,255,255,0.08)', padding: '4px 10px',
                                                            borderRadius: '6px', fontSize: '11px', display: 'inline-block'
                                                        }}>
                                                            🌐 Personal / Independent
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ color: '#aaa' }}>{user.email || 'N/A'}</td>
                                                <td>
                                                    {user.role === 'faculty' ? (
                                                        <span style={{ color: user.isFacultyActive ? '#00C49F' : '#FFBB28' }}>
                                                            {user.isFacultyActive ? 'ACTIVE' : 'PENDING APPROVAL'}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    {user.role === 'faculty' && (
                                                        <button
                                                            onClick={() => toggleFacultyStatus(user._id, user.isFacultyActive)}
                                                            style={{
                                                                background: user.isFacultyActive ? 'rgba(255,255,255,0.1)' : 'rgba(0, 196, 159, 0.2)',
                                                                color: user.isFacultyActive ? '#aaa' : '#00C49F',
                                                                border: `1px solid ${user.isFacultyActive ? '#444' : '#00C49F'}`,
                                                                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold',
                                                                transition: '0.2s'
                                                            }}
                                                        >
                                                            {user.isFacultyActive ? 'DEACTIVATE' : 'APPROVE ACCESS'}
                                                        </button>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button onClick={() => alert(JSON.stringify(user, null, 2))} style={{ background: 'transparent', border: 'none', color: '#0088FE', cursor: 'pointer', opacity: 0.7 }}>
                                                            <FaCode size={16} /> JSON
                                                        </button>
                                                        {(() => {
                                                            const uEmail = (user.email || '').toLowerCase().trim();
                                                            const uName = (user.username || '').toLowerCase().trim();
                                                            const isFounder = uEmail === 'prsnlkalyan@gmail.com' || uName === 'prsnlkalyan@gmail.com' || uName === 'prsnlkalyan' ||
                                                                              uEmail === 'ravirajjavvadhi@gmail.com' || uName === 'ravirajjavvadhi@gmail.com' || uName === 'ravirajjavvadi';

                                                            if (isFounder) {
                                                                return (
                                                                    <span style={{ color: '#00d4ff', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', padding: '4px 8px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '4px', border: '1px solid rgba(0, 212, 255, 0.3)' }} title="Founder Account Protected">
                                                                        🔒 IMMUNE
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <button 
                                                                    className="glitch-btn"
                                                                    onClick={() => handleDeleteUser(user._id, user.username)} 
                                                                    style={{ background: 'transparent', border: 'none', color: '#FF4D4D', cursor: 'pointer', opacity: 0.8 }}
                                                                    title="Delete User Permanently"
                                                                >
                                                                    <FaTrashAlt size={16} /> 
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* BROADCAST TAB */}
                    {activeTab === 'broadcast' && (
                        <motion.div key="broadcast" variants={dashboardVariants} initial="hidden" animate="visible">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <h2 style={headerStyle}>📢 LIVE BROADCAST ANNOUNCEMENTS</h2>
                                    <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0' }}>Push real-time top-banner notices to Students & Faculty in under 2 seconds</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                {/* Broadcast Composer Form */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.2)', backdropFilter: 'blur(5px)' }}>
                                    <h3 style={{ color: '#00d4ff', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaPaperPlane /> Compose Live Announcement
                                    </h3>

                                    <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div>
                                            <label style={{ color: '#aaa', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Message Content</label>
                                            <textarea
                                                rows="4"
                                                placeholder="Enter full notice for targeted students or faculty screens..."
                                                value={broadcastForm.message}
                                                onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                                                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', border: '1px solid #333', padding: '12px', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '13px', resize: 'vertical' }}
                                                required
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div>
                                                <label style={{ color: '#aaa', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Target College</label>
                                                <select
                                                    value={broadcastForm.collegeId}
                                                    onChange={e => setBroadcastForm({ ...broadcastForm, collegeId: e.target.value })}
                                                    style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '10px', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '12px' }}
                                                >
                                                    <option value="">🌐 All Colleges & Users (Global)</option>
                                                    {colleges.map(c => (
                                                        <option key={c._id} value={c._id}>🏫 {c.name} ({c.code})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ color: '#aaa', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Target Audience</label>
                                                <select
                                                    value={broadcastForm.targetRole}
                                                    onChange={e => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                                                    style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '10px', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '12px' }}
                                                >
                                                    <option value="all">👥 All Users (Students & Faculty)</option>
                                                    <option value="student">🎓 Students Only</option>
                                                    <option value="faculty">👨‍🏫 Faculty Only</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ color: '#aaa', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Priority Level</label>
                                            <select
                                                value={broadcastForm.priority}
                                                onChange={e => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                                                style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '10px', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '12px' }}
                                            >
                                                <option value="normal">🔵 Normal Announcement</option>
                                                <option value="important">🟡 Important Notice</option>
                                                <option value="urgent">🔴 URGENT / CRITICAL ALERT</option>
                                            </select>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSendingBroadcast}
                                            style={{
                                                marginTop: '10px', padding: '14px', background: 'linear-gradient(135deg, #00d4ff, #0088FE)',
                                                border: 'none', borderRadius: '8px', color: '#000', fontWeight: '900', fontSize: '14px',
                                                cursor: 'pointer', boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)', transition: 'all 0.2s ease',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                            }}
                                        >
                                            <FaPaperPlane /> {isSendingBroadcast ? 'Publishing Notice...' : '🚀 Broadcast Live Notice (< 2s Delivery)'}
                                        </button>
                                    </form>
                                </div>

                                {/* Active & Historical Broadcasts List */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(5px)' }}>
                                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FaVolumeUp style={{ color: '#00C49F' }} /> Active & Past Broadcasts
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '420px', overflowY: 'auto' }}>
                                        {broadcastsList.length === 0 ? (
                                            <div style={{ color: '#666', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No active broadcasts. Published notices will appear here.</div>
                                        ) : (
                                            broadcastsList.map(b => (
                                                <div key={b._id} style={{
                                                    background: 'rgba(0,0,0,0.4)', border: `1px solid ${b.priority === 'urgent' ? '#FF4D4D' : b.priority === 'important' ? '#FFBB28' : 'rgba(0, 212, 255, 0.3)'}`,
                                                    borderRadius: '10px', padding: '15px', position: 'relative'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                        <span style={{
                                                            fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px',
                                                            background: b.priority === 'urgent' ? 'rgba(255,77,77,0.2)' : b.priority === 'important' ? 'rgba(255,187,40,0.2)' : 'rgba(0,212,255,0.2)',
                                                            color: b.priority === 'urgent' ? '#FF4D4D' : b.priority === 'important' ? '#FFBB28' : '#00d4ff'
                                                        }}>
                                                            {b.priority} | {b.collegeName}
                                                        </span>
                                                        {b.isActive ? (
                                                            <button
                                                                onClick={() => handleDismissBroadcast(b._id)}
                                                                style={{ background: 'rgba(255,77,77,0.15)', border: '1px solid #FF4D4D', color: '#FF4D4D', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                            >
                                                                End Broadcast
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>EXPIRED / ENDED</span>
                                                        )}
                                                    </div>
                                                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{b.title}</div>
                                                    <div style={{ color: '#ccc', fontSize: '12px', lineHeight: '1.4' }}>{b.message}</div>
                                                    <div style={{ color: '#666', fontSize: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Audience: {b.targetRole.toUpperCase()}</span>
                                                        <span>By: {b.createdByName} • {new Date(b.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ISSUES TAB */}
                    {activeTab === 'issues' && (
                        <motion.div key="issues" variants={dashboardVariants} initial="hidden" animate="visible">
                            <h2 style={headerStyle}>ISSUE TRACKER</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                {issues.length === 0 && <div style={{ color: '#666', gridColumn: 'span 2' }}>No active issues reported. System healthy.</div>}
                                {issues.map(issue => (
                                    <motion.div
                                        key={issue._id} variants={cardVariants}
                                        style={{
                                            background: 'rgba(255, 77, 77, 0.05)', borderLeft: '4px solid #FF4D4D',
                                            borderTop: '1px solid rgba(255, 77, 77, 0.1)', borderRight: '1px solid rgba(255, 77, 77, 0.1)', borderBottom: '1px solid rgba(255, 77, 77, 0.1)',
                                            padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '18px' }}>{issue.title}</div>
                                            <span style={{
                                                background: '#FF4D4D', color: '#000', padding: '2px 8px', fontWeight: 'bold',
                                                borderRadius: '2px', fontSize: '10px', textTransform: 'uppercase'
                                            }}>
                                                {issue.severity}
                                            </span>
                                        </div>
                                        <div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.4' }}>{issue.description}</div>
                                        <div style={{ fontSize: '11px', color: '#666', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FaUserShield /> {issue.username || 'Anonymous'}
                                            <span style={{ width: '4px', height: '4px', background: '#444', borderRadius: '50%' }} />
                                            {new Date(issue.createdAt).toLocaleString()}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* COLLEGES TAB */}
                    {activeTab === 'colleges' && (
                        <motion.div key="colleges" variants={dashboardVariants} initial="hidden" animate="visible">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={headerStyle}>MULTI-COLLEGE TENANCY</h2>
                                <button
                                    onClick={() => setShowCreateCollege(true)}
                                    style={{
                                        background: 'linear-gradient(135deg, #00d4ff, #0088FE)', color: '#fff',
                                        border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer',
                                        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 0 15px rgba(0, 212, 255, 0.3)'
                                    }}
                                >
                                    <FaPlus /> CREATE COLLEGE
                                </button>
                            </div>

                            {showCreateCollege && (
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                                    <h3 style={{ color: '#00d4ff', marginTop: 0 }}>Register New Institution</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text" placeholder="College Name (e.g., JNTU Hyderabad)"
                                            value={newCollegeName} onChange={e => setNewCollegeName(e.target.value)}
                                            className="cyber-input"
                                            style={{ flex: 1, padding: '12px', borderRadius: '4px' }}
                                        />
                                        <button onClick={handleCreateCollege} style={{ background: '#00C49F', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Register</button>
                                        <button onClick={() => setShowCreateCollege(false)} style={{ background: '#333', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                {colleges.map(college => (
                                    <motion.div
                                        key={college._id} variants={cardVariants}
                                        style={{
                                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        {!college.isActive && <div style={{ position: 'absolute', top: 0, right: 0, background: '#FF4D4D', color: '#fff', fontSize: '10px', padding: '4px 8px', fontWeight: 'bold', borderBottomLeftRadius: '8px' }}>INACTIVE</div>}
                                        <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FaBuilding style={{ color: '#00d4ff' }} /> {college.name}
                                        </h3>
                                        
                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', marginBottom: '15px' }}>
                                            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase' }}>Permanent Code</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#00d4ff', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>{college.code}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(college.code); alert('Code copied'); }} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }} title="Copy Code"><FaCopy /></button>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
                                            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase' }}>Invite Link</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#FFBB28', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{window.location.origin}/join/{college.inviteToken}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${college.inviteToken}`); alert('Link copied'); }} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', marginLeft: '10px' }} title="Copy Link"><FaCopy /></button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>{college.facultyCount || 0}</div>
                                                <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase' }}>Faculty</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>{college.studentCount || 0}</div>
                                                <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase' }}>Students</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => toggleCollegeStatus(college._id, college.isActive)}
                                                    style={{ background: 'transparent', border: `1px solid ${college.isActive ? '#FF4D4D' : '#00C49F'}`, color: college.isActive ? '#FF4D4D' : '#00C49F', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    {college.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const SidebarIcon = ({ icon, label, active, onClick, color }) => (
    <motion.div
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{
            cursor: 'pointer', color: active ? '#00d4ff' : color || '#666',
            fontSize: '24px', padding: '12px', borderRadius: '12px',
            background: active ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
            border: active ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid transparent',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            boxShadow: active ? '0 0 15px rgba(0, 212, 255, 0.2)' : 'none',
            transition: '0.2s'
        }}
        title={label}
    >
        {icon}
    </motion.div>
);

const KPICard = ({ title, value, color, icon }) => (
    <motion.div
        variants={cardVariants}
        whileHover={{ y: -5, boxShadow: `0 5px 20px ${color}20` }}
        style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30`,
            padding: '25px', borderRadius: '16px', backdropFilter: 'blur(10px)',
            position: 'relative', overflow: 'hidden'
        }}
    >
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '80px', color: color, opacity: 0.1 }}>{icon}</div>
        <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>{title}</div>
        <div style={{ color: '#fff', fontSize: '42px', fontWeight: '900', marginTop: '10px', textShadow: `0 0 20px ${color}40` }}>{value}</div>
    </motion.div>
);

const ChartCard = ({ title, children }) => (
    <motion.div
        variants={cardVariants}
        style={{
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)',
            padding: '25px', borderRadius: '16px', backdropFilter: 'blur(10px)'
        }}
    >
        <div style={{ color: '#fff', marginBottom: '25px', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '4px', height: '15px', background: '#00d4ff' }} />
            {title}
        </div>
        {children}
    </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #333', padding: '10px', borderRadius: '4px' }}>
                <p style={{ color: '#fff', margin: 0, fontWeight: 'bold' }}>{label}</p>
                <p style={{ color: payload[0].color, margin: 0 }}>
                    {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

const headerStyle = {
    fontSize: '32px', fontWeight: '900', letterSpacing: '4px',
    color: '#fff', marginBottom: '40px',
    background: 'linear-gradient(90deg, #fff, #666)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)'
};

export default AdminDashboard;
