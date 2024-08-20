const mongoose = require('mongoose');

const postLikesSchema = new mongoose.Schema({
    postUrl: {
        type: String,
        default: ""
    },
    likedUsers: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('PostLikes', postLikesSchema);