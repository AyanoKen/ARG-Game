const mongoose = require('mongoose');

const playerChoiceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    choices: {
        type: [String],
        default: []
    },
    innovateStep1: {
        type: [String], 
        default: []
    },
    innovateStep2: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('PlayerChoice', playerChoiceSchema);