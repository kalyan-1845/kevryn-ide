const LabSession = require('../models/LabSession');
const User = require('../models/User');
const DeveloperMetrics = require('../models/DeveloperMetrics');

const tools = [
    {
        type: "function",
        function: {
            name: "get_lab_sessions",
            description: "Get past lab sessions for a specific class. Returns the session ID, date, attendance summary, and subject.",
            parameters: {
                type: "object",
                properties: {
                    subjectName: {
                        type: "string",
                        description: "The name of the subject, e.g., 'CN' or 'Flutter'"
                    }
                },
                required: ["subjectName"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generate_csv_report",
            description: "Generates a downloadable CSV file for attendance and detailed metrics for a specific lab session.",
            parameters: {
                type: "object",
                properties: {
                    sessionId: {
                        type: "string",
                        description: "The MongoDB ID of the lab session"
                    }
                },
                required: ["sessionId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_student_dev_metrics",
            description: "Fetches a student's competitive programming insights from GitHub, LeetCode, CodeChef, and HackerRank.",
            parameters: {
                type: "object",
                properties: {
                    rollNumber: {
                        type: "string",
                        description: "The roll number or username of the student."
                    }
                },
                required: ["rollNumber"]
            }
        }
    }
];

const executeTool = async (name, args, facultyId) => {
    switch (name) {
        case 'get_lab_sessions': {
            try {
                const query = { facultyId, isActive: false };
                if (args.subjectName) query.subject = new RegExp(args.subjectName, 'i');
                const sessions = await LabSession.find(query).sort({ endTime: -1 }).limit(5);
                
                if (sessions.length === 0) return "No past lab sessions found for this subject.";
                
                return sessions.map(s => ({
                    sessionId: s._id,
                    name: s.sessionName,
                    subject: s.subject,
                    date: s.startTime,
                    enrolled: s.allowedStudents?.length || 0,
                    attended: s.activeStudents?.length || 0
                }));
            } catch (e) {
                return `Error: ${e.message}`;
            }
        }

        case 'generate_csv_report': {
            try {
                return {
                    message: "CSV Report is ready for download.",
                    downloadLink: `/lab/sessions/${args.sessionId}/csv`,
                    action: "Tell the user to click the download link provided."
                };
            } catch (e) {
                return `Error: ${e.message}`;
            }
        }

        case 'get_student_dev_metrics': {
            try {
                const user = await User.findOne({ 
                    $or: [{ username: args.rollNumber }, { rollNumber: args.rollNumber }]
                });
                if (!user) return `Student ${args.rollNumber} not found.`;

                const metrics = await DeveloperMetrics.findOne({ userId: user._id });
                if (!metrics) return `No developer metrics found for ${user.fullName || args.rollNumber}. They may not have linked their profiles.`;

                return {
                    student: user.fullName || user.username,
                    github: metrics.github ? { repos: metrics.github.publicRepos, stars: metrics.github.stars } : "Not linked",
                    leetcode: metrics.leetcode ? { solved: metrics.leetcode.totalSolved, ranking: metrics.leetcode.ranking } : "Not linked",
                    hackerrank: metrics.hackerrank ? { badges: metrics.hackerrank.badges?.length || 0 } : "Not linked",
                    codechef: metrics.codechef ? { rating: metrics.codechef.rating, stars: metrics.codechef.stars } : "Not linked"
                };
            } catch (e) {
                return `Error: ${e.message}`;
            }
        }

        default:
            return `Tool ${name} not found.`;
    }
};

module.exports = {
    tools,
    executeTool
};
