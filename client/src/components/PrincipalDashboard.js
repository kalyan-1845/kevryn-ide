import React, { useState, useEffect } from 'react';
import './PrincipalDashboard.css';

const _rawServerUrl = (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000').trim();
const SERVER_URL = _rawServerUrl.startsWith('http') ? _rawServerUrl : `https://${_rawServerUrl}`;

const PrincipalDashboard = ({ token }) => {
  const [stats, setStats] = useState({ totalStudents: 0, activeFaculty: 0, labsCompleted: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [facultyActivity, setFacultyActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [statsRes, leaderboardRes, facultyRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/principal/stats`, { headers }).then(res => res.ok ? res.json() : null),
          fetch(`${SERVER_URL}/api/principal/leaderboard`, { headers }).then(res => res.ok ? res.json() : []),
          fetch(`${SERVER_URL}/api/principal/faculty-activity`, { headers }).then(res => res.ok ? res.json() : [])
        ]);
        
        if (statsRes) {
            setStats({
                totalStudents: statsRes.totalStudents || 0,
                activeFaculty: statsRes.totalFaculty || 0, // Backend returns totalFaculty
                labsCompleted: statsRes.totalSubmissions || 0 // Backend returns totalSubmissions
            });
        } else {
            setStats({ totalStudents: 0, activeFaculty: 0, labsCompleted: 0 });
        }
        
        setLeaderboard(leaderboardRes.length ? leaderboardRes : []);
        setFacultyActivity(facultyRes.length ? facultyRes : []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading God-View Analytics...</p>
      </div>
    );
  }

  return (
    <div className="principal-dashboard-container">
      <header className="dashboard-header">
        <h1>College Admin Overview</h1>
        <p>Institutional Analytics & Performance Tracking</p>
      </header>

      <div className="dashboard-grid">
        {/* Executive Overview Section */}
        <section className="dashboard-section glass-panel overview-section">
          <h2>Executive Overview</h2>
          <div className="stats-cards">
            <div className="stat-card">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{stats.totalStudents.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active Faculty</span>
              <span className="stat-value">{stats.activeFaculty.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Labs Completed</span>
              <span className="stat-value">{stats.labsCompleted.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Institutional Integrity Section */}
        <section className="dashboard-section glass-panel integrity-section">
          <h2>Institutional Integrity</h2>
          <div className="integrity-content">
            <div className="integrity-metric">
              <svg className="circular-chart" viewBox="0 0 36 36">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray="95, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">95%</text>
              </svg>
              <div className="integrity-details">
                <h3>Proctoring Compliance</h3>
                <p>Sessions without violations</p>
              </div>
            </div>
          </div>
        </section>

        {/* Placement Leaderboard Section */}
        <section className="dashboard-section glass-panel leaderboard-section">
          <h2>Placement Leaderboard</h2>
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Branch</th>
                  <th>XP Earned</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((student, index) => (
                  <tr key={student._id || student.id || index}>
                    <td>#{index + 1}</td>
                    <td>{student.name || student.username || 'Unknown Student'}</td>
                    <td>{student.branch || 'General'}</td>
                    <td className="highlight-cell">{(student.xp || 0).toLocaleString()} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Faculty ROI Tracker Section */}
        <section className="dashboard-section glass-panel faculty-section">
          <h2>Faculty ROI Tracker</h2>
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Modules Created</th>
                  <th>Students Mentored</th>
                  <th>Avg. Rating</th>
                </tr>
              </thead>
              <tbody>
                {facultyActivity.map((faculty, index) => (
                  <tr key={faculty._id || faculty.id || index}>
                    <td>{faculty.name || faculty.username || 'Unknown Faculty'}</td>
                    <td>{faculty.modulesCreated || faculty.courseCount || 0}</td>
                    <td>{faculty.studentsMentored || faculty.assignmentCount || 0}</td>
                    <td className="rating-cell">★ {faculty.avgRating || '4.5'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
