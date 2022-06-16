require('dotenv').config();
const User = require('../models/User');
const Game = require('../models/Game');
const apiError = require('./apiError');
const catchAsyncErrors = require('./catchAsyncErrors');

exports.recentGames = catchAsyncErrors(async (req, res, next) => {
    const currentTimestamp = new Date();
    const oneYearForward = new Date(Date.now() + 3.156e10);
    const previous14Days = currentTimestamp.setDate(currentTimestamp.getDate() - 15);

    const recentGames = await Game.find({ gameDate: { $gte: previous14Days, $lte: oneYearForward } }).sort('-gameDate');
    if (!recentGames) {
        throw new apiError('Game Details not found', 400);
    }

    const user = await User.findById(req.user.id).select('-password').select('-date');
    if (!user) {
        throw new apiError('Cannot find user.', 403);
    }

    return res.json({ success: true, status: 200, recentGames });
});

//---------------------------------------------------------------------

exports.planTeamData = catchAsyncErrors(async (req, res, next) => {
    const gameId = req.params.id;
    const gameDetails = await Game.findById(gameId);

    const user = await User.findById(req.user.id).select('-password').select('-date');
    if (!user.admin) {
        throw new apiError('User not authorised', 403);
    }

    return res.json({ success: true, status: 200, gameDetails });
});
