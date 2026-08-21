const fs = require('fs');

// Fix App.js
let app = fs.readFileSync('client/src/App.js', 'utf8');
const appTarget = `                if (sess.targetGroup && sess.targetGroup !== '*') {
                    if (!userTargetGroup || userTargetGroup !== sess.targetGroup) return;
                }`;
const appReplace = `                if (sess.allowedStudents && sess.allowedStudents.length > 0 && !sess.allowedStudents.includes(username)) return;`;
app = app.replace(appTarget, appReplace);
fs.writeFileSync('client/src/App.js', app);

// Fix StudentAssignmentView.js
let sav = fs.readFileSync('client/src/components/StudentAssignmentView.js', 'utf8');
const savTarget = `    const submitAssignment = async () => {
        if (!window.confirm("Are you sure you want to submit?")) return;
        setSubmissionStatus('Submitting...');
        try {
            const res = await api.post(/api/assignments//submit, {
                code, language: selectedAssignment.language === 'any' ? studentLanguage : selectedAssignment.language
            });
            setTestResults(res.data.results);
            const { score, maxScore } = res.data.submission;
            setSubmissionStatus(Submitted Successfully! Marks: /);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => console.error(e));
            }
        } catch (e) { setSubmissionStatus('Submission Error: ' + e.message); }
    };`;

const savReplace = `    const submitAssignment = async () => {
        if (!window.confirm("Are you sure you want to submit?")) return;
        setSubmissionStatus('Submitting...');
        try {
            const res = await api.post(\`/api/assignments/\${selectedAssignment._id}/submit\`, {
                code, language: selectedAssignment.language === 'any' ? studentLanguage : selectedAssignment.language
            });
            setTestResults(res.data.results);
            const { score, maxScore } = res.data.submission;
            setSubmissionStatus(\`Submitted Successfully! Marks: \${score}/\${maxScore}\`);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => console.error(e));
            }
        } catch (e) { setSubmissionStatus('Submission Error: ' + e.message); }
    };`;

sav = sav.replace(savTarget, savReplace);
fs.writeFileSync('client/src/components/StudentAssignmentView.js', sav);
