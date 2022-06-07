require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../../middleware/auth');
const {
    validateGameAvailability,
    validateCreateGame,
    validateDeleteGame,
    validateSetGameRegister,
    validateFinalTeam
} = require('../../middleware/gameValidation');
const { validationErrors } = require('../../middleware/validationErrors');
const User = require('../../models/User');
const Game = require('../../models/Game');

//---------------------------------------------------------------------
// @ route          POST api/games/creategame
// @ description    Create game
// @ access         Private
router.post('/createGame', [auth, validateCreateGame, validationErrors], async (req, res) => {
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
});

//---------------------------------------------------------------------
// @ route          DELETE api/games/deletegame
// @ description    Delete game
// @ access         Private
router.delete('/deleteGame/:id', [auth, validateDeleteGame, validationErrors], async (req, res) => {
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
        return res.json({
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
});

//---------------------------------------------------------------------
// @ route          GET api/games/recentgames
// @ description    Get all games
// @ access         Private
router.get('/recentGames', auth, async (req, res) => {
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
});

//---------------------------------------------------------------------
// @ route          GET api/games/gameavailibility
// @ description    Get game availablility
// @ access         Private

router.post('/gameAvailibility', [auth, validateGameAvailability, validationErrors], async (req, res) => {
    try {
        const gameId = await req.body.gameId;

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
});

//---------------------------------------------------------------------
// @ route          POST api/games/setgameregister
// @ description    Open or close game
// @ access         Private
router.post('/setGameRegister', [auth, validateSetGameRegister, validationErrors], async (req, res) => {
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
});

//---------------------------------------------------------------------
// @ route          POST api/games/updatefinalteam
// @ description    Set Final Team
// @ access         Private
router.post('/updateFinalTeam', [auth, validateFinalTeam, validationErrors], async (req, res) => {
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
});

module.exports = router;
