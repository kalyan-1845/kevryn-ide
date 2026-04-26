import React, { useState, useEffect, useRef } from 'react';
import { FaNetworkWired } from 'react-icons/fa';

const LabTimer = ({ isLabOpen, activeFileId, openFiles, code, api, saveLabReport, activeSessionCourseId }) => {
    const [currentLabTime, setCurrentLabTime] = useState(0);
    const pendingTime = useRef({});

    useEffect(() => {
        let interval;
        if (isLabOpen && activeFileId) {
            interval = setInterval(() => {
                const activeFile = openFiles.find(f => f._id === activeFileId);
                const fname = activeFile?.name;
                if (fname) {
                    if (!pendingTime.current[fname]) pendingTime.current[fname] = 0;
                    pendingTime.current[fname] += 1;
                    setCurrentLabTime((prev) => prev + 1);

                    // Sync every 30 seconds
                    if (pendingTime.current[fname] >= 30) {
                        saveLabReport(fname, code, 30, 'in-progress');
                        pendingTime.current[fname] = 0;
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLabOpen, activeFileId, openFiles, code]);

    if (!isLabOpen) return null;

    return (
        <div style={{ marginLeft: '10px', fontSize: '12px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>⏱ {new Date(currentLabTime * 1000).toISOString().substr(11, 8)}</span>
            <button 
                onClick={() => {
                    const activeFile = openFiles.find(f => f._id === activeFileId);
                    const fname = activeFile?.name;
                    if (fname) {
                        saveLabReport(fname, code, pendingTime.current[fname] || 0, 'submitted');
                        pendingTime.current[fname] = 0;
                        alert('Lab Report submitted successfully!');
                    }
                }} 
                style={{ background: '#10b981', border: 'none', borderRadius: '4px', color: '#fff', padding: '2px 8px', cursor: 'pointer' }}
            >
                Submit
            </button>
        </div>
    );
};

export default React.memo(LabTimer);
