import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaClock, FaExclamationTriangle, FaCheckCircle, FaPaperPlane } from 'react-icons/fa';

export default function LiveAptitudeTest({ token, serverUrl, session, onCompleted }) {
    const [answers, setAnswers] = useState({}); // { questionId: ["ans1", ...]}
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [violations, setViolations] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const api = axios.create({ baseURL: serverUrl, headers: { Authorization: token } });

    // Ensure session is defined and we compute the expiration
    const computeTimeRemaining = useCallback(() => {
        if (!session || !session.startTime || !session.duration) return 0;
        const start = new Date(session.startTime).getTime();
        const durationMs = session.duration * 60 * 1000;
        const end = start + durationMs;
        const now = new Date().getTime();
        return Math.max(0, Math.floor((end - now) / 1000));
    }, [session]);

    useEffect(() => {
        if (hasStarted) {
            setTimeRemaining(computeTimeRemaining());
            const timerId = setInterval(() => {
                const tr = computeTimeRemaining();
                setTimeRemaining(tr);
                if (tr <= 0 && !isSubmitting) {
                    clearInterval(timerId);
                    handleAutoSubmit('Time Expired');
                }
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [hasStarted, computeTimeRemaining, isSubmitting]);

    // Telemetry tracking
    useEffect(() => {
        if (!hasStarted || isSubmitting) return;

        const reportViolation = async (event, details) => {
            try {
                const res = await api.post('/api/aptitude/telemetry', {
                    testId: session._id,
                    event, details
                });
                setViolations(res.data.violations);
                if (res.data.violations >= 3) {
                    handleAutoSubmit('Too many violations (Tab Switching).');
                }
            } catch (e) {
                console.error("Telemetry failed", e);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) reportViolation('tab-switch', 'User switched tabs or minimized window.');
        };
        const handleContextMenu = (e) => e.preventDefault(); // Disable Right Click
        const handleCopyPaste = (e) => {
            e.preventDefault();
            reportViolation('paste-detect', 'Copy/Paste attempted');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
        };
    }, [hasStarted, isSubmitting, session, api]);

    const submitExam = async (isAuto = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Format answers for backend: [{ questionId, providedAnswers: [...] }]
            const formattedAnswers = Object.keys(answers).map(qId => ({
                questionId: qId,
                providedAnswers: answers[qId]
            }));

            await api.post('/api/aptitude/submit', {
                testId: session._id,
                answers: formattedAnswers,
                isAutoSubmitted: isAuto
            });
            
            // Exit fullscreen if active
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => console.error(e));
            }

            alert(isAuto ? "Exam Auto-Submitted due to violations or time expiry." : "Exam successfully submitted!");
            onCompleted();
        } catch (e) {
            console.error("Submission failed", e);
            alert("Submission failed. Retrying...");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoSubmit = (reason) => {
        console.log("Auto submitting because:", reason);
        submitExam(true);
    };

    const toggleAnswer = (questionId, value, isMulti) => {
        setAnswers(prev => {
            const current = prev[questionId] || [];
            if (!isMulti) {
                return { ...prev, [questionId]: [value] }; // Replace
            } else {
                if (current.includes(value)) return { ...prev, [questionId]: current.filter(v => v !== value) };
                return { ...prev, [questionId]: [...current, value] };
            }
        });
    };

    const handleStart = async () => {
        try {
            // Request Fullscreen
            await document.documentElement.requestFullscreen();
            setHasStarted(true);
        } catch (e) {
            alert('You must allow fullscreen to take this exam.');
        }
    };

    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Before Starting Screen
    if (!hasStarted) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: '#060b17', zIndex: 10000, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', color: '#f1f5f9'
            }}>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '40px', borderRadius: '16px', maxWidth: '600px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#6366f1', fontSize: '24px' }}>
                        <FaExclamationTriangle />
                    </div>
                    <h1 style={{ margin: '0 0 16px 0', fontSize: '24px', letterSpacing: '-0.5px' }}>Strict Proctoring Active</h1>
                    <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                        You are about to start the exam: <strong>{session?.title}</strong>.<br/>
                        This exam will go into <b>Full Screen Mode</b>. Leaving the tab, splitting the screen, or copying text will be recorded as a violation. <span style={{ color: '#ef4444' }}>3 Violations will result in an automatic failure and submission.</span>
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#1e293b', padding: '16px', borderRadius: '12px', marginBottom: '32px', textAlign: 'left' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Time Limit</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>{session?.duration} Minutes</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Questions</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9' }}>{session?.questions?.length || 0}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleStart}
                        style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', width: '100%', boxShadow: '0 8px 20px rgba(99,102,241,0.4)', transition: 'all 0.2s' }}
                    >
                        I understand, Start Exam
                    </button>
                </div>
            </div>
        );
    }

    // Active Testing Screen
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#060b17', zIndex: 10000, color: '#f1f5f9', display: 'flex', flexDirection: 'column'
        }}>
            {/* Header / StatusBar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#0a1020', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                    <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '700' }}>{session?.title}</h2>
                    <div style={{ fontSize: '12px', color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <FaExclamationTriangle /> Strict Mode Active (Violations: {violations}/3)
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: timeRemaining < 300 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', padding: '8px 16px', borderRadius: '8px', color: timeRemaining < 300 ? '#ef4444' : '#10b981', fontWeight: '800', fontSize: '20px' }}>
                        <FaClock /> {formatTime(timeRemaining)}
                    </div>
                    <button
                        onClick={() => { if(window.confirm("Are you sure you want to finish and submit?")) submitExam(false); }}
                        disabled={isSubmitting}
                        style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}
                    >
                        {isSubmitting ? 'Submitting...' : <><FaPaperPlane /> Submit Exam</>}
                    </button>
                </div>
            </div>

            {/* Questions List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '40px 15%', scrollBehavior: 'smooth', background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)' }}>
                <style>{`
                    .exam-opt:hover { border-color: rgba(99,102,241,0.5) !important; background: rgba(99,102,241,0.05) !important; transform: translateX(8px); }
                    .exam-opt { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; }
                    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>

                {session?.questions?.map((q, i) => {
                    const isMulti = q.type === 'multi-correct';
                    const isTF = q.type === 'tf';
                    const userAns = answers[q._id] || [];
                    return (
                        <div key={q._id} style={{ 
                            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)', 
                            border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', 
                            padding: '40px', marginBottom: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            animation: `slideIn 0.5s ease-out ${i * 0.1}s both`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '2px' }}>Obective {i + 1}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '30px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {q.points} XP • {isMulti ? 'MULTI-SELECT' : isTF ? 'BOOLEAN' : 'SINGLE-CHOICE'}
                                </div>
                            </div>
                            
                            <div style={{ fontSize: '20px', fontWeight: '500', lineHeight: '1.6', marginBottom: '32px', color: '#f1f5f9' }}>
                                {q.text}
                            </div>

                            {/* Options */}
                            {(q.type === 'mcq' || isMulti || isTF) && (
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    {q.options.map((opt, oi) => {
                                        const isSelected = userAns.includes(opt);
                                        return (
                                            <div
                                                key={oi}
                                                className="exam-opt"
                                                onClick={() => toggleAnswer(q._id, opt, isMulti)}
                                                style={{
                                                    padding: '20px 24px', borderRadius: '16px', cursor: 'pointer',
                                                    border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                                                    background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                                                    display: 'flex', alignItems: 'center', gap: '20px',
                                                    boxShadow: isSelected ? '0 10px 20px -5px rgba(99, 102, 241, 0.2)' : 'none'
                                                }}
                                            >
                                                <div style={{ 
                                                    width: '24px', height: '24px', borderRadius: (isMulti) ? '6px' : '50%', 
                                                    border: isSelected ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.2)', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                    background: isSelected ? '#6366f1' : 'transparent', transition: 'all 0.3s', flexShrink: 0 
                                                }}>
                                                    {isSelected && <FaCheckCircle color="#fff" size={12} />}
                                                </div>
                                                <span style={{ fontSize: '16px', color: isSelected ? '#fff' : '#94a3b8', fontWeight: isSelected ? '600' : '400' }}>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Fill Blanks / Code */}
                            {(q.type === 'fill' || q.type === 'code') && (
                                <textarea
                                    className="exam-opt"
                                    value={userAns[0] || ''}
                                    onChange={(e) => toggleAnswer(q._id, e.target.value, false)}
                                    placeholder={q.type === 'code' ? '// Initiate sequence solution...' : 'Input answer...'}
                                    style={{
                                        width: '100%', height: q.type === 'code' ? '250px' : '80px', padding: '20px',
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
                                        color: '#6366f1', fontSize: '16px', outline: 'none', resize: 'vertical',
                                        fontFamily: q.type === 'code' ? '"JetBrains Mono", monospace' : 'inherit',
                                        lineHeight: '1.6'
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* Warning Overlay on Blur (handled natively by browser alert or we just auto-flag) */}
            {violations > 0 && violations < 3 && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#ef4444', color: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', gap: '12px', animation: 'pulse 1s infinite alternate', zIndex: 11000 }}>
                    <FaExclamationTriangle size={24} />
                    <div>
                        <div style={{ fontWeight: '800', letterSpacing: '0.5px' }}>VIOLATION RECORDED</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>You have left the exam area. {3 - violations} attempts remaining before auto-failure.</div>
                    </div>
                </div>
            )}
        </div>
    );
}
