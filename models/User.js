const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String,
    email: String,
    currentLevel: {
        type: String,
        default: '0'
    }
});

module.exports = mongoose.model('User', userSchema);