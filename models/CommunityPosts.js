const mongoose = require('mongoose');

const communityPostsSchema = new mongoose.Schema({
    innovatePosts: {
        type: [[String]],
        default: []
    },
    reimaginePosts: {
        type: [[String]],
        default: []
    },
    addProjectPosts: {
        type: [[String]],
        default: []
    }
});

module.exports = mongoose.model('CommunityPosts', communityPostsSchema);