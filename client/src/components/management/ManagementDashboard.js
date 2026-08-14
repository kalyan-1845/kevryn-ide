import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBuilding, FaUsers, FaClock, FaSignOutAlt } from 'react-icons/fa';
import ParticleBackground from '../ParticleBackground';
import CollegeStructureManager from './CollegeStructureManager';
import StudentOnboarding from './StudentOnboarding';
import TimetableManager from './TimetableManager';

const ManagementDashboard = ({ token, onLogout, userRole }) => {
    const [activeTab, setActiveTab] = useState('structure');

    return (
        <div className="min-h-screen bg-gray-900 text-white flex overflow-hidden">
            <ParticleBackground />
            
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-10 shadow-2xl">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Management
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">ACEEN-A5EC Portal</p>
                </div>

                <nav className="flex-1 mt-6 space-y-2 px-4">
                    <button 
                        onClick={() => setActiveTab('structure')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'structure' ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        <FaBuilding /> College Structure
                    </button>
                    <button 
                        onClick={() => setActiveTab('students')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'students' ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        <FaUsers /> Student Onboarding
                    </button>
                    <button 
                        onClick={() => setActiveTab('timetable')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'timetable' ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        <FaClock /> Timetable Manager
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button 
                        onClick={onLogout} 
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900 hover:bg-opacity-20 transition-all"
                    >
                        <FaSignOutAlt /> Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto relative z-10 h-screen">
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'structure' && <CollegeStructureManager token={token} />}
                    {activeTab === 'students' && <StudentOnboarding token={token} />}
                    {activeTab === 'timetable' && <TimetableManager token={token} />}
                </motion.div>
            </div>
        </div>
    );
};

export default ManagementDashboard;
