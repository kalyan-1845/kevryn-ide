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
                alert(`Magically imported ${res.data.parsedQuestions.length} questions!`);
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

    const addManualQuestion = () => {
        const newQ = [...formData.questions, { text: '', type: 'mcq', options: ['', '', '', ''], correctAnswers: [], points: 1 }];
        setFormData({ ...formData, questions: newQ });
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

    return (
        <div style={{ padding: '30px', color: '#f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaTasks color="#6366f1" /> Aptitude & Exams
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>Deploy strict, timed assessments to specific batches</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600',
                        boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
                    }}
                >
                    <FaPlus /> Create Next Exam
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {tests.map(test => (
                    <div key={test._id} style={{
                        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                        border: test.isActive ? '1px solid #10b981' : '1px solid #334155',
                        borderRadius: '16px', padding: '24px', position: 'relative'
                    }}>
                        {test.isActive && <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', animation: 'pulse 2s infinite' }}>LIVE NOW</div>}
                        
                        <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', color: test.isActive ? '#10b981' : '#f1f5f9' }}>{test.title}</h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>{test.duration} mins • {test.totalMarks} points</p>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => toggleTestActive(test)}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                                    border: 'none', fontWeight: '600',
                                    background: test.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                    color: test.isActive ? '#ef4444' : '#10b981'
                                }}
                            >
                                {test.isActive ? <><FaStop /> Force Stop</> : <><FaPlay /> Start Exam</>}
                            </button>
                        </div>

                        {/* Quick View Telemetry Status */}
                        {test.isActive && (
                            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaExclamationTriangle /> Live Violations Detected: {test.liveTelemetry?.length || 0}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {tests.length === 0 && <div style={{ color: '#64748b', fontStyle: 'italic', padding: '20px' }}>No exams created yet. Add one to get started!</div>}
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '40px'
                }}>
                    <div style={{
                        background: '#0f172a', width: '100%', maxWidth: '1000px', height: '90vh',
                        display: 'flex', flexDirection: 'column', borderRadius: '20px',
                        border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaPlus color="#6366f1" /> Create New Assessment
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
                        </div>
                        
                        {/* Scrollable Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '30px' }}>
                            
                            {/* Left Col: Config */}
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Core Settings</h3>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Exam Title</label>
                                    <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="e.g. Midterm Aptitude" />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Duration (Minutes)</label>
                                    <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                                </div>

                                <h3 style={{ fontSize: '14px', color: '#cbd5e1', margin: '30px 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Batches</h3>
                                <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                    {courses.map(course => (
                                        <div key={course._id} style={{ marginBottom: '10px' }}>
                                            <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 'bold' }}>{course.name}</div>
                                            {course.batches && course.batches.map(b => (
                                                <label key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '13px', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={formData.batches.includes(b._id)} onChange={() => toggleBatchSelection(b._id)} />
                                                    {b.name}
                                                </label>
                                            ))}
                                            {(!course.batches || course.batches.length === 0) && <div style={{ fontSize: '11px', color: '#64748b' }}>No batches found</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Col: Questions */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Questions ({formData.questions.length})</h3>
                                    <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Total Marks: {formData.totalMarks}</span>
                                </div>

                                {/* Magical Upload Section */}
                                <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.1))', border: '1px dashed #8b5cf6', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#a78bfa', fontWeight: 'bold' }}>
                                        <FaMagic /> Smart Bulk Import
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>Paste a messy Word doc or list of questions here. AI will detect the question text, options, and answers instantly.</p>
                                    <textarea value={magicalText} onChange={e => setMagicalText(e.target.value)} placeholder={`1. What is Java?\nA) Language B) Coffee C) Snake\nAnswer: A`} style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', marginBottom: '12px', outline: 'none', resize: 'vertical' }} />
                                    <button onClick={handleMagicalParse} disabled={isParsing} style={{ padding: '8px 16px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
                                        {isParsing ? 'Processing AI...' : 'Parse Questions'}
                                    </button>
                                </div>

                                {/* Render Added Questions */}
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {formData.questions.map((q, i) => (
                                        <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', marginBottom: '12px', position: 'relative' }}>
                                            <button onClick={() => removeQuestion(i)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTrash /></button>
                                            <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Question {i + 1} ({q.type}) • {q.points} pt</div>
                                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>{q.text}</div>
                                            {q.options && q.options.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    {q.options.map((opt, oi) => (
                                                        <div key={oi} style={{ fontSize: '13px', background: '#0f172a', padding: '6px 10px', borderRadius: '4px', border: q.correctAnswers.includes(opt) ? '1px solid #10b981' : '1px solid transparent', color: q.correctAnswers.includes(opt) ? '#10b981' : '#94a3b8' }}>
                                                            {opt} {q.correctAnswers.includes(opt) && <FaCheck style={{ float: 'right', marginTop: '2px' }} />}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {formData.questions.length === 0 && <div style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '20px' }}>No questions yet. Use the magical importer above or add manually.</div>}
                                    <button onClick={addManualQuestion} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed #475569', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer' }}>+ Add Manual Question</button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveTest} disabled={isLoading} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                {isLoading ? 'Saving...' : <><FaSave /> Deploy Test</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AptitudeManager;
