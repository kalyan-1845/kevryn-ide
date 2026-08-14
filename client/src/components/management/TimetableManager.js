import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaTrashAlt, FaClock } from 'react-icons/fa';

const TimetableManager = ({ token }) => {
    const [structures, setStructures] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [facultyId, setFacultyId] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState('Monday');
    const [startTime, setStartTime] = useState('09:30');
    const [endTime, setEndTime] = useState('12:30');

    const api = axios.create({
        baseURL: '/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchStructures();
        fetchFaculty();
        fetchTimetable();
    }, []);

    const fetchStructures = async () => {
        const res = await api.get('/timetable/structure');
        setStructures(res.data);
    };

    const fetchFaculty = async () => {
        const res = await api.get('/admin/users?role=faculty');
        setFacultyList(res.data);
    };

    const fetchTimetable = async () => {
        const res = await api.get('/timetable/schedule');
        setTimetable(res.data);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/timetable/schedule', {
                department, year, section, subjectName, subjectCode, facultyId, dayOfWeek, startTime, endTime
            });
            fetchTimetable();
            // Reset form partly
            setSubjectName('');
            setSubjectCode('');
        } catch (err) {
            console.error(err);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this scheduled session?")) return;
        try {
            await api.delete(`/timetable/schedule/${id}`);
            fetchTimetable();
        } catch (err) {
            console.error(err);
        }
    };

    // Derived dropdown options
    const uniqueDepartments = [...new Set(structures.map(s => s.department))];
    const availableYears = [...new Set(structures.filter(s => s.department === department).map(s => s.year))];
    const structureForSec = structures.find(s => s.department === department && s.year === year);
    const availableSections = structureForSec ? structureForSec.sections : [];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="p-6 text-white w-full">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaClock className="text-blue-400" /> Timetable Manager</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <motion.div className="bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-1 h-fit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 className="text-xl mb-4 text-gray-300">Add Session</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Dept</label>
                                <select required value={department} onChange={(e) => { setDepartment(e.target.value); setYear(''); setSection(''); }} className="w-full bg-gray-700 p-2 rounded text-sm">
                                    <option value="">--</option>
                                    {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Year</label>
                                <select required value={year} onChange={(e) => { setYear(e.target.value); setSection(''); }} className="w-full bg-gray-700 p-2 rounded text-sm">
                                    <option value="">--</option>
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Section</label>
                                <select required value={section} onChange={(e) => setSection(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-sm">
                                    <option value="">--</option>
                                    {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Subject Name</label>
                            <input required type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Python Lab" className="w-full bg-gray-700 p-2 rounded" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Faculty</label>
                            <select required value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className="w-full bg-gray-700 p-2 rounded">
                                <option value="">Select Faculty...</option>
                                {facultyList.map(f => <option key={f._id} value={f._id}>{f.username}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Day</label>
                                <select required value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-sm">
                                    {days.map(d => <option key={d} value={d}>{d.substring(0,3)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Start</label>
                                <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">End</label>
                                <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-sm" />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition mt-4">
                            Add to Timetable
                        </button>
                    </form>
                </motion.div>

                {/* List */}
                <motion.div className="bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 className="text-xl mb-4 text-gray-300">Master Schedule</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400">
                                    <th className="p-2">Class</th>
                                    <th className="p-2">Subject</th>
                                    <th className="p-2">Faculty</th>
                                    <th className="p-2">Schedule</th>
                                    <th className="p-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timetable.map(t => (
                                    <tr key={t._id} className="border-b border-gray-750 hover:bg-gray-750">
                                        <td className="p-2 font-bold text-blue-300">{t.department}-{t.year}-{t.section}</td>
                                        <td className="p-2">{t.subjectName}</td>
                                        <td className="p-2 text-green-400">{t.facultyId?.username || 'Unknown'}</td>
                                        <td className="p-2 text-gray-300">{t.dayOfWeek}, {t.startTime}-{t.endTime}</td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => handleDelete(t._id)} className="text-red-400 hover:text-red-300">
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TimetableManager;
