import React from 'react';
import { FaTimes } from 'react-icons/fa';

export default function LegalDocs({ type, onClose }) {
  if (!type) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#1e293b',
        color: '#f8fafc',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '85vh',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #334155'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0f172a'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
            {type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
            }}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', lineHeight: '1.6', fontSize: '0.95rem' }}>
          {type === 'terms' ? (
            <>
              <p><strong>Last Updated:</strong> July 2026</p>
              <p>Welcome to KevRyn IDE. By registering for an account as a Student or Faculty member, you accept these terms and conditions in full.</p>
              
              <h3 style={{ marginTop: '20px', color: '#60a5fa' }}>1. User Accounts and Responsibilities</h3>
              <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li><strong>Registration:</strong> You must register using a valid email address.</li>
                <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li><strong>Roles:</strong> Faculty members have privileges to create lab sessions and monitor activity. Students must adhere to the rules of the lab sessions they join.</li>
              </ul>

              <h3 style={{ marginTop: '20px', color: '#60a5fa' }}>2. Acceptable Use</h3>
              <p>You agree to use the platform only for educational and programming purposes. You strictly agree <strong>NOT</strong> to:</p>
              <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li>Host, execute, or distribute malware, viruses, or malicious scripts.</li>
                <li>Attempt to hack, reverse-engineer, or disrupt the cloud servers or desktop application.</li>
                <li>Engage in academic dishonesty during restricted lab sessions.</li>
              </ul>

              <h3 style={{ marginTop: '20px', color: '#60a5fa' }}>3. Academic Integrity & Monitoring</h3>
              <p>When joining a "Lab Session", you acknowledge that activity will be monitored by the assigned Faculty member (including live typing, tab switching, and code execution).</p>
            </>
          ) : (
            <>
              <p><strong>Last Updated:</strong> July 2026</p>
              <p>KevRyn IDE ("we", "our", or "us") is committed to protecting the privacy of all students, faculty members, and institutions that use our platform.</p>
              
              <h3 style={{ marginTop: '20px', color: '#60a5fa' }}>1. Information We Collect</h3>
              <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li><strong>Account Information:</strong> Name, email address, and profile picture provided during Google OAuth.</li>
                <li><strong>Code & Files:</strong> The source code and files you create on our cloud servers.</li>
                <li><strong>Usage Data & Telemetry:</strong> During active "Lab Sessions", we collect behavioral data including tab-switching events, copy-paste events, and keystroke activity.</li>
              </ul>

              <h3 style={{ marginTop: '20px', color: '#60a5fa' }}>2. How We Use Your Information</h3>
              <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li>To provide, maintain, and improve the IDE platform.</li>
                <li><strong>For Faculty Monitoring:</strong> To provide faculty with analytics and live monitoring during official Lab Sessions.</li>
              </ul>

              <h3 style={{ marginTop: '20px', color: '#60a5fa' }}>3. Data Sharing</h3>
              <p>We do <strong>not</strong> sell, trade, or rent your personal information. If you are a student participating in a lab session, your activity data and code are shared strictly with the faculty member administering the session.</p>

              <h3 style={{ marginTop: '20px', color: '#60a5fa' }}>4. Data Security</h3>
              <p>We implement industry-standard security measures (including secure WebSockets, database encryption, and HTTPS) to protect your code and personal data against unauthorized access.</p>
            </>
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #334155',
          background: '#0f172a',
          textAlign: 'right'
        }}>
          <button 
            onClick={onClose}
            style={{
              background: '#3b82f6', color: 'white', border: 'none',
              padding: '8px 24px', borderRadius: '6px', cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
