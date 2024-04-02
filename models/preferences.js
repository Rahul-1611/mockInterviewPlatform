const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const preferences = new Schema({
    profile: {
        type: String,
        required: true,
        enum: ['frontend', 'backend', 'cloud', 'devops', 'data', 'ml'],
        default: 'frontend'
    },
    jobType: {
        type: String,
        required: true,
        enum: ['full', 'intern'],
        default: 'full'
    },
    interviewType: {
        type: String,
        required: true,
        enum: ['technical', 'behavioural'],
        default: 'technical'
    },
    experience: {
        type: String,
        required: true,
        enum: ['rookie', 'intermediate', 'expert'],
        default: 'intermediate'
    },
    language: {
        type: String,
        required: true,
        // Assuming language refers to programming languages for the job
        enum: ['javascript', 'java', 'c++'],
        default: 'c++'
    },
    duration: {
        type: String,
        required: true,
        // Assuming duration refers to the estimated length of the interview
        enum: ['15min', '30min', '60min'],
        default: '15min'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Assuming your user model is named 'User'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Preferences', preferences);


