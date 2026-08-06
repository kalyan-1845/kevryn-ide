import React from 'react';
import { FaBullhorn } from 'react-icons/fa';

export default function TopBroadcastBanner({ activeBroadcast, setActiveBroadcast }) {
  if (!activeBroadcast) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999999,
      background: activeBroadcast.priority === 'urgent' 
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.96), rgba(185, 28, 28, 0.96))' 
        : activeBroadcast.priority === 'important'
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.96), rgba(180, 83, 9, 0.96))'
        : 'linear-gradient(135deg, rgba(14, 165, 233, 0.96), rgba(3, 105, 161, 0.96))',
      color: '#fff', padding: '12px 24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      animation: 'slideDownBanner 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      fontFamily: "'Inter', sans-serif",
      borderBottom: '1px solid rgba(255,255,255,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
          <FaBullhorn size={20} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#e0f2fe' }}>
            📢 INSTITUTIONAL NOTICE • {activeBroadcast.collegeName || 'KEVRYN GLOBAL'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', margin: '2px 0 1px' }}>
            {activeBroadcast.title}
          </div>
          <div style={{ fontSize: '13px', color: '#f0f9ff', opacity: 0.95 }}>
            {activeBroadcast.message}
          </div>
        </div>
      </div>
      <button 
        onClick={() => setActiveBroadcast(null)}
        style={{
          background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff',
          padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
          fontSize: '12px', transition: 'all 0.2s', flexShrink: 0, marginLeft: '20px'
        }}
      >
        Dismiss ✕
      </button>
    </div>
  );
}
