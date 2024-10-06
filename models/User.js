const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String,
    email: String,
    newUser: {
        type: Boolean,
        default: true
    },
    admin: {
        type: Boolean,
        default: false
    },
    currentLevel: {
        type: Number,
        default: 0
    },
    unlockedLevels: {
        type: [Number],
        default: [0, 1, 4, 5]
    },
    completedLevels: {
        type: [Number],
        default: []
    },
    levelCompletionDates: {
        type: Map,
        of: String,  // This will store the completion date as a string
        default: {1:"2024-07-21", 2: "2024-07-21"}
    },
    playerTroop:{
        type: String,
        default: ''
    },
    playerAvatar: {
        type: String,
        default: '/images/blankprofile.png'
    },
    playerBadge:{
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    campus: {
        type: String,
        default: ''
    },
    school: {
        type: String,
        default: ''
    },
    purdueMail: {
        type: String,
        default: ""
    },
    googleOptIn: {
        type: Boolean,
        default: false
    },
    jobTitle: {
        type: String, 
        default: "Student"
    },
    location: {
        type: String,
        default: "United States of America"
    }
});

module.exports = mongoose.model('User', userSchema);