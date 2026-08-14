import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaPlayCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const StudentTimetableWidget = ({ token, activeSessionId, onEnterLab }) => {
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const api = axios.create({
        baseURL: '/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/timetable/my-schedule/student');
            setSchedule(res.data);
        } catch (err) {
            console.error("Failed to fetch schedule");
        }
        setIsLoading(false);
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const safeSchedule = Array.isArray(schedule) ? schedule : [];
    const todaysClasses = safeSchedule.filter(s => s.dayOfWeek === today);

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <FaCalendarAlt className="text-blue-400" /> Today's Schedule ({today})
            </h3>

            {isLoading ? (
                <div className="text-gray-400">Loading schedule...</div>
            ) : todaysClasses.length === 0 ? (
                <div className="text-gray-500 italic">No scheduled labs for today. Enjoy your day!</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todaysClasses.map(cls => (
                        <motion.div key={cls._id} whileHover={{ scale: 1.02 }} className="bg-gray-700 p-4 rounded-lg border border-gray-600 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="font-bold text-lg text-white mb-1">{cls.subjectName}</div>
                            <div className="text-sm text-gray-400 mb-2">Prof. {cls.facultyId?.username || 'Unknown'}</div>
                            <div className="text-sm text-blue-300 font-mono mb-4">{cls.startTime} - {cls.endTime}</div>
                            
                            {/* If a session is active and the lab corresponds to this class, they should join via the top banner usually. But we can show a button if activeSessionId is present. */}
                            {activeSessionId ? (
                                <button 
                                    onClick={onEnterLab}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2 transition"
                                >
                                    <FaPlayCircle /> Join Live Lab
                                </button>
                            ) : (
                                <div className="text-xs text-gray-400 text-center py-2 bg-gray-800 rounded">Waiting for faculty to start...</div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentTimetableWidget;
