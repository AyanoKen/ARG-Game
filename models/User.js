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
    }
});

module.exports = mongoose.model('User', userSchema);