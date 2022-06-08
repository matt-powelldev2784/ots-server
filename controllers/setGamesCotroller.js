require('dotenv').config();
const User = require('../models/User');
const Game = require('../models/Game');

exports.createGame = async (req, res) => {
    try {
        const { gameDate, gameName } = req.body;

        const user = await User.findById(req.user.id).select('-password');
        if (!user.admin) {
            return res
                .status(403)
                .json({ success: false, status: 403, errors: [{ msg: 'User not authorised. Please login with authorised user' }] });
        }

        await Game.create({ gameDate, gameName });
        return res.status(200).json({
            success: true,
            status: 200,
            msg: 'The following game has been created:',
            gameDate,
            gameName
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /games/creategame' }] });
    }
};

//---------------------------------------------------------------------

exports.deleteGame = async (req, res) => {
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

        await Game.findByIdAndRemove(gameId);
        return res.status(200).json({
            success: true,
            status: 200,
            msg: 'The following game has been deleted:',
            gameName: gameDetails.gameName,
            gameDate: gameDetails.gameDate
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /games/deleteGame' }] });
    }
};

//---------------------------------------------------------------------

exports.setGameRegister = async (req, res) => {
    try {
        const { gameId, gameClosed } = req.body;

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

        const finalTeam = gameDetails.playersAvailable;
        await Game.findByIdAndUpdate(gameId, { $set: { gameClosed: gameClosed, finalTeam: finalTeam } });
        const closedGame = await Game.findById(gameId);
        return res.json({ success: false, status: 200, closedGame });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /games/setgameregister' }] });
    }
};

//---------------------------------------------------------------------

exports.updateFinalTeam = async (req, res) => {
    try {
        const { gameId, finalTeam } = req.body;

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

        await Game.findByIdAndUpdate(gameId, { $set: { finalTeam: finalTeam } });
        return res.status(200).json({
            success: false,
            status: 200,
            msg: 'The final Team has been updated with the data below:',
            gameId: gameId,
            finalTeam: finalTeam
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /games/gameavailibility' }] });
    }
};
