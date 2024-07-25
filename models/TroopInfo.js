const mongoose = require('mongoose');

const troopSchema = new mongoose.Schema({
    name: String,
    welcomeText: String,
    emblem: String,
    symbol: String,
    motto: String,
    traits: String
});

const TroopInfo = mongoose.model('TroopInfo', troopSchema);

module.exports = TroopInfo;