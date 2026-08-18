const express = require('express');
const router = express.Router();
const User = require('../User');
const axios = require('axios');
const cheerio = require('cheerio');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const { authenticate } = require('../utils/authMiddleware');

// 1. Save External Profiles (For Student Command Center)
router.put('/profiles', authenticate, async (req, res) => {
    try {
        const { github, leetcode, hackerrank, codechef } = req.body;
        
        // Find user by req.user.userId
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.externalProfiles) {
            user.externalProfiles = {};
        }

        if (github !== undefined) user.externalProfiles.github = github;
        if (leetcode !== undefined) user.externalProfiles.leetcode = leetcode;
        if (hackerrank !== undefined) user.externalProfiles.hackerrank = hackerrank;
        if (codechef !== undefined) user.externalProfiles.codechef = codechef;

        await user.save();
        res.json({ success: true, externalProfiles: user.externalProfiles });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Fetch Advanced Tracking Data for a specific student roll number/username
router.get('/:identifier', authenticate, async (req, res) => {
    try {
        const identifier = req.params.identifier;
        
        // Find user by rollNumber or username
        const user = await User.findOne({ 
            $or: [{ username: identifier }, { rollNumber: identifier }]
        });

        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const profiles = user.externalProfiles || {};
        const responseData = {
            github: { username: profiles.github, data: null, error: null },
            leetcode: { username: profiles.leetcode, data: null, error: null },
            hackerrank: { username: profiles.hackerrank, data: null, error: null },
            codechef: { username: profiles.codechef, data: null, error: null }
        };

        // --- GITHUB ---
        if (profiles.github) {
            try {
                const token = process.env.GITHUB_API_TOKEN;
                const headers = token ? { Authorization: `token ${token}` } : {};
                const [userRes, reposRes] = await Promise.all([
                    axios.get(`https://api.github.com/users/${profiles.github}`, { headers }),
                    axios.get(`https://api.github.com/users/${profiles.github}/repos?sort=updated&per_page=5`, { headers })
                ]);
                responseData.github.data = {
                    avatar_url: userRes.data.avatar_url,
                    public_repos: userRes.data.public_repos,
                    followers: userRes.data.followers,
                    recent_repos: reposRes.data.map(r => ({
                        name: r.name,
                        url: r.html_url,
                        language: r.language,
                        stars: r.stargazers_count,
                        updated_at: r.updated_at
                    }))
                };
            } catch (err) {
                responseData.github.error = "Failed to fetch GitHub data";
            }
        }

        // --- LEETCODE (GraphQL) ---
        if (profiles.leetcode) {
            try {
                const query = `
                    query userPublicProfile($username: String!) {
                        matchedUser(username: $username) {
                            submitStats: submitStatsGlobal {
                                acSubmissionNum {
                                    difficulty
                                    count
                                }
                            }
                            profile {
                                ranking
                                reputation
                            }
                        }
                    }
                `;
                const lcRes = await axios.post('https://leetcode.com/graphql', {
                    query,
                    variables: { username: profiles.leetcode }
                });

                if (lcRes.data.data && lcRes.data.data.matchedUser) {
                    const stats = lcRes.data.data.matchedUser.submitStats.acSubmissionNum;
                    const profile = lcRes.data.data.matchedUser.profile;
                    responseData.leetcode.data = {
                        ranking: profile.ranking,
                        reputation: profile.reputation,
                        solved: {
                            all: stats.find(s => s.difficulty === 'All')?.count || 0,
                            easy: stats.find(s => s.difficulty === 'Easy')?.count || 0,
                            medium: stats.find(s => s.difficulty === 'Medium')?.count || 0,
                            hard: stats.find(s => s.difficulty === 'Hard')?.count || 0,
                        }
                    };
                } else {
                     responseData.leetcode.error = "User not found on LeetCode";
                }
            } catch (err) {
                responseData.leetcode.error = "Failed to fetch LeetCode data";
            }
        }

        // --- HACKERRANK (Scraping) ---
        if (profiles.hackerrank) {
            try {
                const hrRes = await axios.get(`https://www.hackerrank.com/${profiles.hackerrank}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const $ = cheerio.load(hrRes.data);
                
                const badges = [];
                $('.hacker-badge').each((i, el) => {
                    const badgeTitle = $(el).find('.badge-title').text().trim();
                    const starCount = $(el).find('.star').length; // or text parsing
                    if (badgeTitle) badges.push({ title: badgeTitle, stars: starCount });
                });

                // Fallback basic parsing if new UI
                const levelText = $('.ui-badge-wrap').text();
                
                responseData.hackerrank.data = {
                    badges: badges,
                    rawLevel: levelText || 'Level available on profile'
                };
            } catch (err) {
                 // Might 404 or block scraping
                responseData.hackerrank.error = "Profile is private or HackerRank UI changed";
            }
        }

        // --- CODECHEF (Scraping) ---
        if (profiles.codechef) {
            try {
                const ccRes = await axios.get(`https://www.codechef.com/users/${profiles.codechef}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const $ = cheerio.load(ccRes.data);
                const rating = $('.rating-number').text().trim() || 'N/A';
                const stars = $('.rating-star').text().trim() || '';
                const globalRank = $('.rating-ranks strong').first().text().trim() || 'N/A';
                
                responseData.codechef.data = {
                    rating: rating,
                    stars: stars,
                    globalRank: globalRank
                };
            } catch (err) {
                responseData.codechef.error = "Failed to scrape CodeChef";
            }
        }

        res.json(responseData);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
