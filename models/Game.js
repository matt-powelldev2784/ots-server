const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    gameDate: {
        type: Date,
        required: true
    },
    gameName: {
        type: String,
        required: true
    },
    playersAvailable: [],
    playersUnavailable: [],
    finalTeam: [],
    gameClosed: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = Game = mongoose.model('game', GameSchema);
