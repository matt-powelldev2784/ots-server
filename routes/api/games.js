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
        await Game.create({ gameDate, gameName });

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.json({ msg: 'User not found. Please ensure active user is logged in' });
        }

        if (user.email === process.env.adminEmail) {
            return res.json({
                msg: 'The following game has been created:',
                gameDate,
                gameName
            });
        }

        return res.status(401).json({ msg: 'Your user is not authorized to create a new match day' });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ msg: 'Server Error. Unhandled error at api route /games/creategame' });
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
            return res.json({ msg: 'gameDetails not found. Please provide valid objectId for the game.' });
        }

        const user = await User.findById(req.user.id).select('-password').select('-date');
        if (!user) {
            return res.json({ msg: 'User not found. Please ensure active user is logged in' });
        }

        if (!user.email === process.env.adminEmail) {
            return res.status(401).json({ msg: 'User not authorised' });
        }

        if (user.email === process.env.adminEmail) {
            if (user.admin) {
                await Game.findByIdAndRemove(gameId);
                return res.json({
                    msg: 'The following game has been deleted:',
                    gameName: gameDetails.gameName,
                    gameDate: gameDetails.gameDate
                });
            }
        }
        return res.status(401).json({ msg: 'Unable to delete game' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error. Unhandled error at api route /games/deletegame');
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
        const gameDetails = await Game.find({ gameDate: { $gte: last14Days, $lte: forward1Year } }).sort('-gameDate');

        if (!gameDetails) {
            return res.json({ msg: 'gameDetails not found.' });
        }

        const user = await User.findById(req.user.id).select('-password').select('-date');
        if (!user) {
            return res.json({ msg: 'User not found. Please ensure active user is logged in' });
        }

        if (user && gameDetails) {
            return res.json(gameDetails);
        }

        return res.status(500).json({ msg: 'Unable to retrieve game at api route /games/recentgames' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error. Unhandled error at api route /games/recentgames');
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
            return res.json({ msg: 'gameDetails not found. Please provide valid objectId for the game.' });
        }

        const user = await User.findById(req.user.id).select('-password').select('-date');
        if (!user) {
            return res.json({ msg: 'User not found. Please ensure active user is logged in' });
        }

        if (user.admin) {
            return res.json(gameDetails);
        }

        if (!user.admin) {
            return res.status(401).json({ msg: 'User not authorised' });
        }

        return res.status(500).json({ msg: 'Unable to retrieve game at api route /games/gameavailibility' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error. Unhandled error at api route /games/gameavailibility');
    }
});

//---------------------------------------------------------------------
// @ route          POST api/games/setgameregister
// @ description    Open or close game
// @ access         Private
router.post('/setGameRegister', [auth, validateSetGameRegister, validationErrors], async (req, res) => {
    try {
        const gameId = await req.body.gameId;
        const gameClosed = await req.body.gameClosed;

        const gameDetails = await Game.findById(gameId);
        if (!gameDetails) {
            return res.json({ msg: 'gameDetails not found. Please provide valid objectId for the game.' });
        }

        const user = await User.findById(req.user.id).select('-password').select('-date');
        if (!user) {
            return res.json({ msg: 'User not found. Please ensure active user is logged in' });
        }

        if (user.email === process.env.adminEmail) {
            const finalTeam = gameDetails.playersAvailable;
            await Game.findByIdAndUpdate(gameId, { $set: { gameClosed: gameClosed, finalTeam: finalTeam } });
            const closedGame = await Game.findById(gameId);
            return res.json(closedGame);
        }

        if (!user.email === process.env.adminEmail) {
            return res.status(401).json({ msg: 'User not authorised' });
        }

        return res.status(500).json({ msg: 'Unable to retrieve game at api route /games/setgameregister' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error. Unhandled error at api route /games/setgameregister');
    }
});

//---------------------------------------------------------------------
// @ route          POST api/games/updatefinalteam
// @ description    Set Final Team
// @ access         Private
router.post('/updateFinalTeam', [auth, validateFinalTeam, validationErrors], async (req, res) => {
    try {
        const gameId = req.body.gameId;
        const finalTeam = req.body.finalTeam;

        const gameDetails = await Game.findById(gameId);
        if (!gameDetails) {
            return res.json({ msg: 'gameDetails not found. Please provide valid objectId for the game.' });
        }

        const user = await User.findById(req.user.id).select('-password').select('-date');
        if (!user) {
            return res.json({ msg: 'User not found. Please ensure active user is logged in' });
        }

        if (!user.admin) {
            return res.status(401).json({ msg: 'User not authorised' });
        }

        if (user.admin) {
            if (user.admin) {
                await Game.findByIdAndUpdate(gameId, { $set: { finalTeam: finalTeam } });
                return res.json({
                    msg: 'The final Team has been updated with the data below:',
                    gameId: gameId,
                    finalTeam: finalTeam
                });
            }
        }

        return res.status(500).json({ msg: 'Unable to retrieve game at api route /games/gameavailibility' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error. Unhandled error at api route /games/gameavailibility');
    }
});

module.exports = router;
