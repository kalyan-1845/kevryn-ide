const mongoose = require('mongoose');

const DeveloperMetricsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lastSyncedAt: { type: Date, default: Date.now },
    
    github: {
        username: String,
        isValid: { type: Boolean, default: false },
        avatarUrl: String,
        followers: Number,
        publicReposCount: Number,
        totalStars: Number,
        topLanguages: [{ language: String, count: Number }],
        repos: [{
            name: String,
            url: String,
            language: String,
            stars: Number,
            updatedAt: Date
        }],
        errorMessage: String
    },

    leetcode: {
        username: String,
        isValid: { type: Boolean, default: false },
        ranking: Number,
        reputation: Number,
        contestRating: Number,
        solved: {
            all: Number,
            easy: Number,
            medium: Number,
            hard: Number
        },
        recentSubmissions: [{
            title: String,
            timestamp: Date,
            statusDisplay: String
        }],
        errorMessage: String
    },

    hackerrank: {
        username: String,
        isValid: { type: Boolean, default: false },
        badges: [{ title: String, stars: Number }],
        certificates: [String],
        errorMessage: String
    },

    codechef: {
        username: String,
        isValid: { type: Boolean, default: false },
        rating: Number,
        stars: String,
        globalRank: Number,
        countryRank: Number,
        highestRating: Number,
        errorMessage: String
    }
}, { timestamps: true });

// Optimize lookups
DeveloperMetricsSchema.index({ userId: 1 });

module.exports = mongoose.model('DeveloperMetrics', DeveloperMetricsSchema);
