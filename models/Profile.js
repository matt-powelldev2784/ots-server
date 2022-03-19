const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    defaultTeam: {
        type: String,
        required: true
    },
    position: {
        type: String,
        requred: true,
        default: 'NK'
    },
    rating: {
        type: Number
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
