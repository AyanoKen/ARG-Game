const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String,
    email: String,
    newUser: {
        type: Boolean,
        default: true
    },
    currentLevel: {
        type: Number,
        default: 0
    },
    unlockedLevels: {
        type: [Number],
        default: [1,2,3,4]
    },
    completedLevels: {
        type: [Number],
        default: [1,2]
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
        default: 'blankprofile.png'
    }
});

module.exports = mongoose.model('User', userSchema);