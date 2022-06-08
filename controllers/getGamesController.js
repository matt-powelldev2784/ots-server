require('dotenv').config();
const User = require('../models/User');
const Game = require('../models/Game');

exports.recentGames = async (req, res) => {
    try {
        let last14Days = new Date();
        let forward1Year = new Date(Date.now() + 3.156e10);
        last14Days.setDate(last14Days.getDate() - 15);

        const recentGames = await Game.find({ gameDate: { $gte: last14Days, $lte: forward1Year } }).sort('-gameDate');
        if (!recentGames) {
            return res.status(400).json({
                success: false,
                status: 400,
                errors: [{ msg: 'Game Details not found. Please provide valid objectId for the game.' }]
            });
        }

        const user = await User.findById(req.user.id).select('-password').select('-date');
        if (!user) {
            return res
                .status(403)
                .json({ success: false, status: 403, errors: [{ msg: 'User not authorised. Please login with authorised user' }] });
        }

        return res.json({ success: false, status: 200, recentGames });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /games/recentgames' }] });
    }
};

//---------------------------------------------------------------------

exports.planTeamData = async (req, res) => {
    try {
        const gameId = req.params.id;
        const gameDetails = await Game.findById(gameId);
        if (!gameDetails) {
            return res.status(400).json({
                success: false,
                status: 400,
                errors: [{ msg: 'Game Details not found. Please provide valid objectId for the game.' }]
            });
        }

        const user = await User.findById(req.user.id).select('-password').select('-date');
        if (!user.admin) {
            return res
                .status(403)
                .json({ success: false, status: 403, errors: [{ msg: 'User not authorised. Please login with authorised user' }] });
        }

        return res.json({ success: false, status: 200, gameDetails });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /games/gameavailibility' }] });
    }
};
