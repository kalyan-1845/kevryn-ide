import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTasks, FaMagic, FaTrash, FaPlay, FaStop, FaSave, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const AptitudeManager = ({ token, serverUrl }) => {
    const [tests, setTests] = useState([]);
    const [courses, setCourses] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: 60,
        totalMarks: 0,
        batches: [],
        questions: []
    });

    const [magicalText, setMagicalText] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });

    useEffect(() => {
        fetchTests();
        fetchCourses();
    }, []);

    const fetchTests = async () => {
        try {
            const res = await api.get('/api/aptitude/faculty/tests');
            setTests(res.data.tests || []);
        } catch (e) {
            console.error("Failed to fetch custom tests", e);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/api/courses');
            setCourses(res.data);
        } catch (e) {
            console.error("Failed to fetch courses", e);
        }
    };

    const handleMagicalParse = async () => {
        if (!magicalText.trim()) return alert('Paste some text first!');
        setIsParsing(true);
        try {
            const res = await api.post('/api/aptitude/upload-parse', { rawText: magicalText });
            if (res.data.success && res.data.parsedQuestions) {
                const newQuestions = [...formData.questions, ...res.data.parsedQuestions];
                
                // Recalculate total marks automatically
                const newTotal = newQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
                
                setFormData({ ...formData, questions: newQuestions, totalMarks: newTotal });
                setMagicalText('');
            }
        } catch (e) {
            alert(e.response?.data?.error || e.message);
        } finally {
            setIsParsing(false);
        }
    };

    const toggleBatchSelection = (batchId) => {
        const newBatches = formData.batches.includes(batchId)
            ? formData.batches.filter(id => id !== batchId)
            : [...formData.batches, batchId];
        setFormData({ ...formData, batches: newBatches });
    };

    const removeQuestion = (index) => {
        const newQ = formData.questions.filter((_, i) => i !== index);
        const newTotal = newQ.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
        setFormData({ ...formData, questions: newQ, totalMarks: newTotal });
    };

    const addManualQuestion = (type = 'mcq') => {
        let newQ;
        if (type === 'tf') {
            newQ = { text: '', type: 'tf', options: ['True', 'False'], correctAnswers: ['True'], points: 1 };
        } else {
            newQ = { text: '', type, options: ['', '', '', ''], correctAnswers: [], points: 1 };
        }
        const updatedQuestions = [...formData.questions, newQ];
        setFormData({ ...formData, questions: updatedQuestions });
    };

    const updateQuestion = (index, updates) => {
        const newQuestions = [...formData.questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        const newTotal = newQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
        setFormData({ ...formData, questions: newQuestions, totalMarks: newTotal });
    };

    const handleSaveTest = async () => {
        if (!formData.title) return alert("Title required.");
        if (formData.batches.length === 0) return alert("Select at least one target batch.");
        if (formData.questions.length === 0) return alert("Add at least one question.");

        setIsLoading(true);
        try {
            await api.post('/api/aptitude/create', formData);
            setShowCreateModal(false);
            setFormData({ title: '', description: '', duration: 60, totalMarks: 0, batches: [], questions: [] });
            fetchTests();
        } catch (e) {
            alert(e.response?.data?.error || e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTestActive = async (test) => {
        const action = test.isActive ? 'end' : 'start';
        if (action === 'start' && !window.confirm(`Are you sure you want to START ${test.title}? Students in selected batches will be notified instantly.`)) return;

        try {
            await api.post(`/api/aptitude/${test._id}/${action}`);
            fetchTests();
        } catch (e) {
            alert(e.response?.data?.error || e.message);
        }
    };

    // Styles
    const glassStyle = {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        outline: 'none',
        transition: 'all 0.3s ease',
        fontSize: '14px'
    };

    const cardStyle = {
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
    };

    return (
        <div style={{ padding: '40px', color: '#f8fafc', minHeight: '100vh', background: '#020617' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <FaTasks /> Clinical Assessments
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '16px', margin: '8px 0 0 0' }}>Precision testing infrastructure for elite developer training</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        padding: '14px 28px', background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700',
                        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <FaPlus /> Create Mission
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
                {tests.map(test => (
                    <div key={test._id} style={{
                        ...glassStyle,
                        borderRadius: '24px', padding: '30px', position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default'
                    }}>
                        {test.isActive && <div style={{ position: 'absolute', top: '24px', right: '24px', background: '#ef4444', color: '#fff', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)', animation: 'pulse 2s infinite' }}>LIVE</div>}
                        
                        <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0', color: '#f1f5f9' }}>{test.title}</h3>
                        <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>
                            <span>{test.duration} MINS</span>
                            <span>•</span>
                            <span>{test.totalMarks} POINTS</span>
                            <span>•</span>
                            <span>{test.questions?.length || 0} Qs</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => toggleTestActive(test)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                                    border: 'none', fontWeight: '700', fontSize: '14px',
                                    background: test.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                    color: test.isActive ? '#f87171' : '#4ade80',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {test.isActive ? <><FaStop /> END SESSION</> : <><FaPlay /> START SESSION</>}
                            </button>
                        </div>

                        {test.isActive && test.liveTelemetry?.length > 0 && (
                            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ fontSize: '13px', color: '#f87171', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaExclamationTriangle /> VIOLATIONS: {test.liveTelemetry.length}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(12px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        ...glassStyle,
                        width: '95%', maxWidth: '1400px', height: '90vh',
                        display: 'flex', flexDirection: 'column', borderRadius: '32px',
                        animation: 'modalSlideUp 0.4s ease-out'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '30px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px', color: '#f1f5f9' }}>
                                    <FaPlus color="#818cf8" /> Initialize Assessment
                                </h2>
                                <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Configure parameters and quest objectives</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>&times;</button>
                        </div>
                        
                        {/* Body */}
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                            
                            {/* Left Sidebar: Config */}
                            <div style={{ width: '380px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '30px 40px', overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>
                                <section style={{ marginBottom: '35px' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#6366f1', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Primary Settings</h3>
                                    
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>MISSION TITLE</label>
                                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} placeholder="Deep Learning Fundamentals..." />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>DURATION (MINUTES)</label>
                                        <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} style={inputStyle} />
                                    </div>
                                </section>

                                <section>
                                    <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#6366f1', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Target Squads</h3>
                                    <div style={{ 
                                        background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', 
                                        border: '1px solid rgba(255,255,255,0.05)', padding: '15px', 
                                        maxHeight: '400px', overflowY: 'auto' 
                                    }}>
                                        {courses.map(course => (
                                            <div key={course._id} style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: '900', marginBottom: '10px' }}>{course.name}</div>
                                                {course.batches && course.batches.map(b => (
                                                    <label key={b._id} style={{ 
                                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', 
                                                        fontSize: '14px', cursor: 'pointer', borderRadius: '8px',
                                                        background: formData.batches.includes(b._id) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                        color: formData.batches.includes(b._id) ? '#818cf8' : '#94a3b8',
                                                        marginBottom: '4px', border: '1px solid',
                                                        borderColor: formData.batches.includes(b._id) ? 'rgba(99,102,241,0.2)' : 'transparent',
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        <input type="checkbox" checked={formData.batches.includes(b._id)} onChange={() => toggleBatchSelection(b._id)} style={{ accentColor: '#6366f1' }} />
                                                        {b.name}
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Main Workspace: Questions */}
                            <div style={{ flex: 1, padding: '30px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>Quest Log</h3>
                                        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>{formData.questions.length} Active Challenges</p>
                                    </div>
                                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '12px 20px', borderRadius: '14px' }}>
                                        <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: '700', marginRight: '10px' }}>TOTAL XP:</span>
                                        <span style={{ fontSize: '20px', fontWeight: '900', color: '#f1f5f9' }}>{formData.totalMarks}</span>
                                    </div>
                                </div>

                                {/* Magical Upload Section */}
                                <div style={{ 
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))', 
                                    border: '1px dashed rgba(99, 102, 241, 0.3)', borderRadius: '24px', 
                                    padding: '30px', marginBottom: '30px' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', color: '#a78bfa', fontWeight: '900', fontSize: '16px' }}>
                                        <FaMagic /> SMART BULK INGESTION
                                    </div>
                                    <textarea 
                                        value={magicalText} 
                                        onChange={e => setMagicalText(e.target.value)} 
                                        placeholder={`1. How does async/await work in JS?\nA) Non-blocking B) Blocking C) Coffee D) Magic\nAnswer: A`} 
                                        style={{ 
                                            ...inputStyle, height: '120px', background: 'rgba(0,0,0,0.2)', 
                                            marginBottom: '20px', resize: 'none', fontFamily: 'monospace' 
                                        }} 
                                    />
                                    <button 
                                        onClick={handleMagicalParse} 
                                        disabled={isParsing} 
                                        style={{ 
                                            padding: '12px 24px', background: '#6366f1', color: '#fff', 
                                            border: 'none', borderRadius: '12px', cursor: 'pointer', 
                                            display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isParsing ? 'NEURAL COMPILING...' : 'MAGICAL INGEST'}
                                    </button>
                                </div>

                                {/* Question Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {formData.questions.map((q, i) => (
                                        <div key={i} style={cardStyle}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ background: '#1e293b', color: '#6366f1', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px' }}>{i + 1}</span>
                                                    <select 
                                                        value={q.type} 
                                                        onChange={e => updateQuestion(i, { type: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: '#818cf8', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', outline: 'none', cursor: 'pointer' }}
                                                    >
                                                        <option value="mcq">Multiple Choice</option>
                                                        <option value="multi-correct">Multi Select</option>
                                                        <option value="tf">True/False</option>
                                                    </select>
                                                </div>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>XP:</span>
                                                        <input 
                                                            type="number" 
                                                            value={q.points} 
                                                            onChange={e => updateQuestion(i, { points: Number(e.target.value) })}
                                                            style={{ width: '45px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', textAlign: 'center', borderRadius: '6px', padding: '4px', fontSize: '13px' }}
                                                        />
                                                    </div>
                                                    <button onClick={() => removeQuestion(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}><FaTrash /></button>
                                                </div>
                                            </div>

                                            <textarea 
                                                value={q.text} 
                                                onChange={e => updateQuestion(i, { text: e.target.value })}
                                                placeholder="Enter question text..."
                                                style={{ ...inputStyle, marginBottom: '20px', background: 'transparent', border: 'none', padding: '0', fontSize: '16px', fontWeight: '600', resize: 'none', minHeight: '60px' }}
                                            />

                                            {/* Options */}
                                            {q.type !== 'short' && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    {q.options.map((opt, oi) => (
                                                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div 
                                                                onClick={() => {
                                                                    const current = q.correctAnswers || [];
                                                                    let updated;
                                                                    if (q.type === 'mcq' || q.type === 'tf') {
                                                                        updated = [opt];
                                                                    } else {
                                                                        updated = current.includes(opt) ? current.filter(c => c !== opt) : [...current, opt];
                                                                    }
                                                                    updateQuestion(i, { correctAnswers: updated });
                                                                }}
                                                                style={{ 
                                                                    padding: '12px 15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', 
                                                                    border: '1px solid', borderColor: q.correctAnswers.includes(opt) ? '#10b981' : 'rgba(255,255,255,0.05)',
                                                                    flex: 1, display: 'flex', justifyContent: 'space-between', cursor: 'pointer',
                                                                    transition: 'all 0.2s', position: 'relative'
                                                                }}
                                                            >
                                                                <input 
                                                                    value={opt} 
                                                                    onChange={e => {
                                                                        const newOpts = [...q.options];
                                                                        newOpts[oi] = e.target.value;
                                                                        updateQuestion(i, { options: newOpts });
                                                                    }}
                                                                    placeholder={`Option ${oi + 1}`}
                                                                    style={{ background: 'transparent', border: 'none', color: q.correctAnswers.includes(opt) ? '#10b981' : '#f1f5f9', width: '90%', fontSize: '14px', outline: 'none' }}
                                                                />
                                                                {q.correctAnswers.includes(opt) && <FaCheck color="#10b981" />}
                                                            </div>
                                                            {q.options.length > 2 && q.type !== 'tf' && (
                                                                <button 
                                                                    onClick={() => {
                                                                        const newOpts = q.options.filter((_, idx) => idx !== oi);
                                                                        updateQuestion(i, { options: newOpts });
                                                                    }}
                                                                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                                                                >
                                                                    &times;
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {q.type !== 'tf' && (
                                                        <button 
                                                            onClick={() => updateQuestion(i, { options: [...q.options, ''] })}
                                                            style={{ padding: '10px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', color: '#64748b', borderRadius: '12px', fontSize: '12px', cursor: 'pointer' }}
                                                        >
                                                            + ADD OPTION
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                        <button onClick={() => addManualQuestion('mcq')} style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '16px', color: '#94a3b8', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>+ ADD MCQ</button>
                                        <button onClick={() => addManualQuestion('multi-correct')} style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '16px', color: '#94a3b8', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>+ ADD MULTI-SELECT</button>
                                        <button onClick={() => addManualQuestion('tf')} style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '16px', color: '#94a3b8', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>+ ADD TRUE/FALSE</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '30px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '20px', background: 'rgba(255,255,255,0.02)' }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ padding: '14px 30px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontWeight: '700' }}>DISCARD</button>
                            <button 
                                onClick={handleSaveTest} 
                                disabled={isLoading} 
                                style={{ 
                                    padding: '14px 40px', background: 'linear-gradient(135deg, #10b981, #059669)', 
                                    color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '800',
                                    boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                {isLoading ? 'INITIALIZING...' : <><FaSave /> DEPLOY MISSION</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
            `}</style>
        </div>
    );
};

export default AptitudeManager;
