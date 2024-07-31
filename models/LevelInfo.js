const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
    id: Number,
    brief: String,
    steps: String,
    optionalUrl: String,
    href: String
});

const LevelInfo = mongoose.model('LevelInfo', levelSchema);

module.exports = LevelInfo;