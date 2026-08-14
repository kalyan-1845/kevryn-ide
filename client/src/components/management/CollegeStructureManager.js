import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const CollegeStructureManager = ({ token }) => {
    const [structures, setStructures] = useState([]);
    const [department, setDepartment] = useState('CSE');
    const [year, setYear] = useState('1');
    const [sections, setSections] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const departments = ['CSE', 'ECE', 'IT', 'MECH', 'CIVIL', 'EEE'];
    const years = ['1', '2', '3', '4'];

    useEffect(() => {
        fetchStructures();
    }, []);

    const api = axios.create({
        baseURL: '/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchStructures = async () => {
        try {
            const res = await api.get('/timetable/structure');
            setStructures(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const sectionArray = sections.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
            await api.post('/timetable/structure', {
                department, year, sections: sectionArray
            });
            setMessage('Structure saved successfully!');
            fetchStructures();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to save');
        }
        setIsLoading(false);
    };

    return (
        <div className="p-6 text-white w-full">
            <h2 className="text-2xl font-bold mb-6">College Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Form */}
                <motion.div className="bg-gray-800 p-6 rounded-lg shadow-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-xl mb-4 text-gray-300">Define Sections</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1">Department</label>
                            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded">
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Year</label>
                            <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded">
                                {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Available Sections (comma separated, e.g., A, B, C)</label>
                            <input 
                                type="text" 
                                value={sections} 
                                onChange={(e) => setSections(e.target.value)} 
                                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500"
                                placeholder="A, B, C, D"
                                required
                            />
                        </div>
                        {message && <p className={`text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition">
                            {isLoading ? 'Saving...' : 'Save Structure'}
                        </button>
                    </form>
                </motion.div>

                {/* List */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl mb-4 text-gray-300">Current Structure</h3>
                    {(!Array.isArray(structures) || structures.length === 0) ? <p className="text-gray-400">No structures defined yet.</p> : (
                        <div className="space-y-4">
                            {structures.map((s) => (
                                <div key={s._id} className="bg-gray-700 p-4 rounded flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-lg text-blue-400">{s.department} - Year {s.year}</div>
                                        <div className="text-sm text-gray-300 mt-1">Sections: {s.sections.join(', ')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CollegeStructureManager;
