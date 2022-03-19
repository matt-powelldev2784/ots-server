const mongoose = require('mongoose');

const GameDaySchema = new mongoose.Schema({
    GameDay: {
        type: Date,
        required: true
    },
    UserRegistered: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            },
            playing: {
                type: Boolean,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = GameDay = mongoose.model('GameDaySchema');
