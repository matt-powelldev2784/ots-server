const mongoose = require('mongoose');

const CreateGameSchema = new mongoose.Schema({
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

module.exports = CreateGame = mongoose.model('game', CreateGameSchema);
