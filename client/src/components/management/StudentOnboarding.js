import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const StudentOnboarding = ({ token }) => {
    const [structures, setStructures] = useState([]);
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    const [students, setStudents] = useState([]);
    const [rollNumbersString, setRollNumbersString] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const api = axios.create({
        baseURL: '/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchStructures();
    }, []);

    useEffect(() => {
        if (department && year && section) {
            fetchStudents();
        } else {
            setStudents([]);
        }
    }, [department, year, section]);

    const fetchStructures = async () => {
        try {
            const res = await api.get('/timetable/structure');
            setStructures(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get(`/timetable/students?department=${department}&year=${year}&section=${section}`);
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkAdd = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const res = await api.post('/timetable/students/bulk-add', {
                department, year, section, rollNumbersString
            });
            setMessage(`Added ${res.data.added} students. Failed: ${res.data.failed}`);
            setRollNumbersString('');
            fetchStudents();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Bulk add failed');
        }
        setIsLoading(false);
    };

    const toggleActive = async (id) => {
        try {
            await api.patch(`/timetable/students/${id}/toggle-active`);
            fetchStudents();
        } catch (err) {
            console.error("Failed to toggle status");
        }
    };

    // Derived dropdown options
    const uniqueDepartments = [...new Set(structures.map(s => s.department))];
    const availableYears = [...new Set(structures.filter(s => s.department === department).map(s => s.year))];
    const structureForSec = structures.find(s => s.department === department && s.year === year);
    const availableSections = structureForSec ? structureForSec.sections : [];

    return (
        <div className="p-6 text-white w-full">
            <h2 className="text-2xl font-bold mb-6">Student Onboarding & Management</h2>

            {/* Hierarchical Filter */}
            <div className="flex gap-4 mb-8 bg-gray-800 p-4 rounded-lg">
                <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">Department</label>
                    <select value={department} onChange={(e) => { setDepartment(e.target.value); setYear(''); setSection(''); }} className="w-full bg-gray-700 p-2 rounded text-white">
                        <option value="">Select Dept</option>
                        {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">Year</label>
                    <select value={year} onChange={(e) => { setYear(e.target.value); setSection(''); }} disabled={!department} className="w-full bg-gray-700 p-2 rounded text-white disabled:opacity-50">
                        <option value="">Select Year</option>
                        {availableYears.map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">Section</label>
                    <select value={section} onChange={(e) => setSection(e.target.value)} disabled={!year} className="w-full bg-gray-700 p-2 rounded text-white disabled:opacity-50">
                        <option value="">Select Section</option>
                        {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                </div>
            </div>

            {section && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Students */}
                    <motion.div className="bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-1 h-fit" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="text-xl mb-4 text-blue-400">Bulk Register Students</h3>
                        <form onSubmit={handleBulkAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Paste Roll Numbers (Comma separated)</label>
                                <textarea
                                    value={rollNumbersString}
                                    onChange={(e) => setRollNumbersString(e.target.value)}
                                    placeholder="22ACEG001, 22ACEG002, ..."
                                    className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-blue-500 h-32"
                                    required
                                ></textarea>
                            </div>
                            {message && <p className={`text-sm ${message.includes('Failed: 0') ? 'text-green-400' : 'text-yellow-400'}`}>{message}</p>}
                            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition">
                                {isLoading ? 'Registering...' : 'Upload & Register'}
                            </button>
                        </form>
                    </motion.div>

                    {/* View Students */}
                    <motion.div className="bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl text-gray-300">Enrolled Students ({students.length})</h3>
                            <span className="text-sm bg-gray-700 px-3 py-1 rounded">{department} - Yr {year} - Sec {section}</span>
                        </div>
                        
                        {students.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">No students found in this section.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-700 text-gray-400">
                                            <th className="p-3">Roll Number</th>
                                            <th className="p-3">Username</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student._id} className="border-b border-gray-750 hover:bg-gray-750">
                                                <td className="p-3 font-mono text-blue-300">{student.rollNumber || student.username}</td>
                                                <td className="p-3">{student.username}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${student.isActiveStudent !== false ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                                        {student.isActiveStudent !== false ? 'Active' : 'Deactivated'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button 
                                                        onClick={() => toggleActive(student._id)}
                                                        className={`text-sm px-3 py-1 rounded ${student.isActiveStudent !== false ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} transition`}
                                                    >
                                                        {student.isActiveStudent !== false ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default StudentOnboarding;
