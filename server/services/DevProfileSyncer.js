const axios = require('axios');
const User = require('../User');
const DeveloperMetrics = require('../models/DeveloperMetrics');

class DevProfileSyncer {
    static async syncUser(userId) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.externalProfiles) return null;

            const { github, leetcode, hackerrank, codechef } = user.externalProfiles;
            
            let metrics = await DeveloperMetrics.findOne({ userId });
            if (!metrics) {
                metrics = new DeveloperMetrics({ userId });
            }

            metrics.lastSyncedAt = new Date();

            // --- 1. GITHUB ---
            if (github) {
                try {
                    metrics.github.username = github;
                    const token = process.env.GITHUB_API_TOKEN;
                    const headers = token ? { Authorization: `token ${token}` } : {};
                    
                    const userRes = await axios.get(`https://api.github.com/users/${github}`, { headers });
                    const reposRes = await axios.get(`https://api.github.com/users/${github}/repos?per_page=100&sort=updated`, { headers });
                    
                    const repos = reposRes.data;
                    let totalStars = 0;
                    const langMap = {};
                    
                    const formattedRepos = repos.map(r => {
                        totalStars += r.stargazers_count;
                        if (r.language) {
                            langMap[r.language] = (langMap[r.language] || 0) + 1;
                        }
                        return {
                            name: r.name,
                            url: r.html_url,
                            language: r.language,
                            stars: r.stargazers_count,
                            updatedAt: r.updated_at
                        };
                    });

                    const topLanguages = Object.keys(langMap)
                        .map(lang => ({ language: lang, count: langMap[lang] }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5); // Top 5 languages

                    metrics.github.isValid = true;
                    metrics.github.avatarUrl = userRes.data.avatar_url;
                    metrics.github.followers = userRes.data.followers;
                    metrics.github.publicReposCount = userRes.data.public_repos;
                    metrics.github.totalStars = totalStars;
                    metrics.github.topLanguages = topLanguages;
                    metrics.github.repos = formattedRepos;
                    metrics.github.errorMessage = '';
                } catch (err) {
                    metrics.github.isValid = false;
                    metrics.github.errorMessage = err.response?.status === 404 ? 'User not found' : 'Failed to fetch GitHub data';
                }
            } else {
                metrics.github.isValid = false;
                metrics.github.errorMessage = 'No username provided';
            }

            // --- 2. LEETCODE ---
            if (leetcode) {
                try {
                    metrics.leetcode.username = leetcode;
                    
                    // GraphQL query for Profile, Contest, and Recent Submissions
                    const query = `
                        query userProfile($username: String!) {
                            matchedUser(username: $username) {
                                submitStats: submitStatsGlobal {
                                    acSubmissionNum { difficulty count }
                                }
                                profile { ranking reputation }
                            }
                            userContestRanking(username: $username) {
                                rating
                            }
                            recentAcSubmissionList(username: $username, limit: 10) {
                                title
                                timestamp
                                statusDisplay
                            }
                        }
                    `;
                    
                    const lcRes = await axios.post('https://leetcode.com/graphql', {
                        query, variables: { username: leetcode }
                    });

                    if (lcRes.data.data && lcRes.data.data.matchedUser) {
                        const stats = lcRes.data.data.matchedUser.submitStats.acSubmissionNum;
                        const profile = lcRes.data.data.matchedUser.profile;
                        const contest = lcRes.data.data.userContestRanking;
                        const recent = lcRes.data.data.recentAcSubmissionList || [];

                        metrics.leetcode.isValid = true;
                        metrics.leetcode.ranking = profile.ranking;
                        metrics.leetcode.reputation = profile.reputation;
                        metrics.leetcode.contestRating = contest ? Math.round(contest.rating) : 0;
                        metrics.leetcode.solved = {
                            all: stats.find(s => s.difficulty === 'All')?.count || 0,
                            easy: stats.find(s => s.difficulty === 'Easy')?.count || 0,
                            medium: stats.find(s => s.difficulty === 'Medium')?.count || 0,
                            hard: stats.find(s => s.difficulty === 'Hard')?.count || 0,
                        };
                        metrics.leetcode.recentSubmissions = recent.map(sub => ({
                            title: sub.title,
                            timestamp: new Date(parseInt(sub.timestamp) * 1000),
                            statusDisplay: sub.statusDisplay
                        }));
                        metrics.leetcode.errorMessage = '';
                    } else {
                        metrics.leetcode.isValid = false;
                        metrics.leetcode.errorMessage = 'User not found on LeetCode';
                    }
                } catch (err) {
                    metrics.leetcode.isValid = false;
                    metrics.leetcode.errorMessage = 'Failed to fetch LeetCode data';
                }
            } else {
                metrics.leetcode.isValid = false;
                metrics.leetcode.errorMessage = 'No username provided';
            }

            // --- 3. HACKERRANK ---
            if (hackerrank) {
                try {
                    metrics.hackerrank.username = hackerrank;
                    // Use HackerRank internal REST API
                    const hrRes = await axios.get(`https://www.hackerrank.com/rest/hackers/${hackerrank}/badges`, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    
                    if (hrRes.data && hrRes.data.models) {
                        const badges = hrRes.data.models.map(b => ({
                            title: b.badge_name,
                            stars: b.stars
                        }));
                        metrics.hackerrank.isValid = true;
                        metrics.hackerrank.badges = badges;
                        metrics.hackerrank.errorMessage = '';
                    } else {
                         throw new Error("Invalid format");
                    }
                } catch (err) {
                    metrics.hackerrank.isValid = false;
                    metrics.hackerrank.errorMessage = err.response?.status === 404 ? 'User not found' : 'Failed to fetch HackerRank data (API changed)';
                }
            } else {
                metrics.hackerrank.isValid = false;
                metrics.hackerrank.errorMessage = 'No username provided';
            }

            // --- 4. CODECHEF ---
            if (codechef) {
                try {
                    metrics.codechef.username = codechef;
                    // Using codechef-api vercel wrapper (highly reliable for CodeChef)
                    const ccRes = await axios.get(`https://codechef-api.vercel.app/handle/${codechef}`);
                    
                    if (ccRes.data && ccRes.data.success) {
                        metrics.codechef.isValid = true;
                        metrics.codechef.rating = ccRes.data.currentRating;
                        metrics.codechef.stars = ccRes.data.stars;
                        metrics.codechef.globalRank = ccRes.data.globalRank;
                        metrics.codechef.countryRank = ccRes.data.countryRank;
                        metrics.codechef.highestRating = ccRes.data.highestRating;
                        metrics.codechef.errorMessage = '';
                    } else {
                        metrics.codechef.isValid = false;
                        metrics.codechef.errorMessage = 'User not found on CodeChef';
                    }
                } catch (err) {
                    metrics.codechef.isValid = false;
                    metrics.codechef.errorMessage = 'Failed to fetch CodeChef data';
                }
            } else {
                metrics.codechef.isValid = false;
                metrics.codechef.errorMessage = 'No username provided';
            }

            await metrics.save();
            return metrics;
        } catch (error) {
            console.error(`Global sync error for user ${userId}:`, error);
            return null;
        }
    }

    // Cron job entrypoint
    static async syncAllUsers() {
        console.log("[DevProfileSyncer] Starting background sync for all users...");
        // Find users who have at least one external profile defined
        const users = await User.find({
            $or: [
                { 'externalProfiles.github': { $ne: '' } },
                { 'externalProfiles.leetcode': { $ne: '' } },
                { 'externalProfiles.hackerrank': { $ne: '' } },
                { 'externalProfiles.codechef': { $ne: '' } }
            ]
        });

        console.log(`[DevProfileSyncer] Found ${users.length} users to sync.`);
        
        for (const user of users) {
            await this.syncUser(user._id);
            // Wait 2 seconds between users to avoid rate limits
            await new Promise(r => setTimeout(r, 2000)); 
        }
        
        console.log("[DevProfileSyncer] Background sync completed.");
    }
}

module.exports = DevProfileSyncer;
