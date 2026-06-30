import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { FaPlus, FaTrash, FaSave } from 'react-icons/fa';

const AssignmentManager = ({ token, serverUrl, userId }) => {
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [assignments, setAssignments] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingAssignmentId, setEditingAssignmentId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        language: 'python',
        batchId: '', // Added for targeted assignments
        starterCode: '# Write your code here\n',
        points: 100,
        dueDate: '',
        testCases: [{ input: '', expectedOutput: '', isHidden: false, points: 10 }]
    });

    const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourseId) fetchAssignments();
    }, [selectedCourseId]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/api/courses');
            setCourses(res.data);
            if (res.data.length > 0) setSelectedCourseId(res.data[0]._id);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAssignments = async () => {
        try {
            const res = await api.get(`/api/assignments/course/${selectedCourseId}`);
            setAssignments(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleTestCaseChange = (index, field, value) => {
        const newCases = [...formData.testCases];
        newCases[index][field] = value;
        setFormData({ ...formData, testCases: newCases });
    };

    const addTestCase = () => {
        setFormData({
            ...formData,
            testCases: [...formData.testCases, { input: '', expectedOutput: '', isHidden: false, points: 10 }]
        });
    };

    const removeTestCase = (index) => {
        const newCases = formData.testCases.filter((_, i) => i !== index);
        setFormData({ ...formData, testCases: newCases });
    };

    const handleSubmit = async () => {
        if (!formData.title) return alert("Title is required");
        try {
            if (isEditing && editingAssignmentId) {
                await api.put(`/api/assignments/${editingAssignmentId}`, { ...formData, courseId: selectedCourseId });
                alert("Assignment Updated!");
            } else {
                await api.post('/api/assignments', { ...formData, courseId: selectedCourseId });
                alert("Assignment Created!");
            }
            setShowCreateModal(false);
            setIsEditing(false);
            setEditingAssignmentId(null);
            fetchAssignments();
        } catch (e) {
            alert("Failed to save assignment: " + (e.response?.data?.error || e.message));
        }
    };

    const handleEditClick = (assignment) => {
        setFormData({
            title: assignment.title,
            description: assignment.description,
            language: assignment.language,
            starterCode: assignment.starterCode,
            testCases: assignment.testCases,
            points: assignment.maxPoints || 100,
            dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
            batchId: assignment.batchId || ''
        });
        setEditingAssignmentId(assignment._id);
        setIsEditing(true);
        setShowCreateModal(true);
    };

    const handleCreateClick = () => {
        setFormData({
            title: '', description: '', language: 'python', starterCode: '',
            testCases: [], points: 100, dueDate: '', batchId: ''
        });
        setIsEditing(false);
        setEditingAssignmentId(null);
        setShowCreateModal(true);
    };

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Assignment Manager</h2>
                <select
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', background: '#334155', color: '#fff', border: 'none' }}
                >
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
            </div>

            <button
                onClick={handleCreateClick}
                style={{ marginBottom: '20px', padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <FaPlus /> Create Assignment
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {assignments.map(a => (
                    <div key={a._id} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', position: 'relative' }}>
                        <h3>{a.title}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}</p>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#cbd5e1' }}>
                            {a.testCases.length} Test Cases | {a.maxPoints} Points
                        </div>
                        <button 
                            onClick={() => handleEditClick(a)}
                            style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                            EDIT
                        </button>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#0f172a', width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h2 style={{ marginBottom: '20px' }}>{isEditing ? 'Edit Assignment' : 'Create Assignment'}</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '13px' }}>Target Audience</label>
                                <select 
                                    value={formData.batchId} 
                                    onChange={e => setFormData({ ...formData, batchId: e.target.value })}
                                    style={{ padding: '10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
                                >
                                    <option value="">- Entire Course -</option>
                                    {courses.find(c => c._id === selectedCourseId)?.batches?.map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '13px' }}>Language Restriction</label>
                                <select 
                                    value={formData.language} 
                                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                                    style={{ padding: '10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
                                >
                                    <option value="any">Any Language (Student Choice)</option>
                                    <option value="python">Python</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="c">C</option>
                                    <option value="cpp">C++</option>
                                    <option value="java">Java</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                            <input
                                placeholder="Assignment Title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                style={{ padding: '10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', overflow: 'hidden' }}>
                                <span style={{ padding: '10px', color: '#94a3b8', fontSize: '13px', background: 'rgba(0,0,0,0.2)' }}>Max Points</span>
                                <input
                                    type="number"
                                    value={formData.points}
                                    onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                    style={{ padding: '10px', background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }}
                                />
                            </div>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                style={{ padding: '10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
                            />
                        </div>

                        <textarea
                            placeholder="Description (Markdown supported)"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', height: '100px', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', marginBottom: '15px' }}
                        />

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Starter Code ({formData.language})</label>
                            <div style={{ height: '200px', border: '1px solid #334155', borderRadius: '6px', overflow: 'hidden' }}>
                                <Editor
                                    height="100%"
                                    defaultLanguage="python"
                                    theme="vs-dark"
                                    value={formData.starterCode}
                                    onChange={val => setFormData({ ...formData, starterCode: val })}
                                    options={{ minimap: { enabled: false } }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4>Test Cases</h4>
                                <button onClick={addTestCase} style={{ background: '#334155', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>+ Add Case</button>
                            </div>
                            {formData.testCases.map((tc, i) => (
                                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                    <input placeholder="Input (Leave blank if not needed)" value={tc.input} onChange={e => handleTestCaseChange(i, 'input', e.target.value)} style={{ flex: 1, padding: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }} />
                                    <input placeholder="Expected Output (Required)" value={tc.expectedOutput} onChange={e => handleTestCaseChange(i, 'expectedOutput', e.target.value)} style={{ flex: 1, padding: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }} />
                                    <button onClick={() => removeTestCase(i)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><FaTrash /></button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSubmit} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FaSave /> {isEditing ? 'Update Assignment' : 'Save Assignment'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentManager;
