const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Game = require('../../models/Game');
const Profile = require('../../models/Profile');
const req = require('express/lib/request');
const { response } = require('express');

//---------------------------------------------------------------------
// @ route          POST api/games/creategame
// @ description    Create game
// @ access         Private
router.post(
    '/creategame',
    [
        auth,
        [
            check('gameDate', 'Error. Game Date is a required field').not().isEmpty(),
            //check('gameDate', 'Game Date should be valid date string i.e 2022-12-25').isISO8601(),
            check('gameName', 'Error. Game Name is a required field').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { gameDate, gameName } = req.body;
            await Game.create({ gameDate, gameName });

            const user = await User.findById(req.user.id).select('-password');
            if (!user) {
                return res.json({ msg: 'User not found. Please ensure active user is logged in' });
            }

            if (user.email === 'admin@oldthorntonians.com' && user.name === 'admin') {
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
    }
);

//---------------------------------------------------------------------
// @ route          POST api/games/deletegame
// @ description    Delete game
// @ access         Private
router.delete('/deletegame/:id', [auth, []], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

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

        if (!user.admin) {
            return res.status(401).json({ msg: 'User not authorised' });
        }

        if (user.admin) {
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
router.get('/recentgames', auth, async (req, res) => {
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
router.post(
    '/gameavailibility',
    [
        auth,
        [
            check('gameId', 'Error. Game not found! Please proivide valid game id.').not().isEmpty(),
            check('gameId', 'Error. Invalid gameId. The objectID for the game is not found').custom((value, { req }) => {
                return mongoose.Types.ObjectId.isValid(value) === true;
            })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
    }
);

//---------------------------------------------------------------------
// @ route          POST api/games/setgameregister
// @ description    Open or close game
// @ access         Private
router.post(
    '/setgameregister',
    [
        auth,
        [
            check('gameId', 'Error. Game not found! Please proivide valid game id.').not().isEmpty(),
            check('gameClosed', 'Error. gameClosed is a required field. Please specify true or false').not().isEmpty().isBoolean(),
            check('gameId', 'Error. Invalid gameId. The objectID for the game is not found').custom((value, { req }) => {
                return mongoose.Types.ObjectId.isValid(value) === true;
            })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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

            if (user.admin) {
                const finalTeam = gameDetails.playersAvailable;
                await Game.findByIdAndUpdate(gameId, { $set: { gameClosed: gameClosed, finalTeam: finalTeam } });
                const closedGame = await Game.findById(gameId);
                return res.json(closedGame);
            }

            if (!user.admin) {
                return res.status(401).json({ msg: 'User not authorised' });
            }

            return res.status(500).json({ msg: 'Unable to retrieve game at api route /games/closegame' });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error. Unhandled error at api route /games/closegame');
        }
    }
);

//---------------------------------------------------------------------
// @ route          POST api/games/updatefinalteam
// @ description    Set Final Team
// @ access         Private
router.post(
    '/updatefinalteam',
    [
        auth,
        [
            check('gameId', 'Error. Game not found! Please proivide valid game id.').not().isEmpty(),
            check('gameId', 'Error. Invalid gameId. The objectID for the game is not found').custom((value, { req }) => {
                return mongoose.Types.ObjectId.isValid(value) === true;
            }),
            check('finalTeam', 'Error. finalTeam must not be empty and must be an array.').not().isEmpty().isArray()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
    }
);

module.exports = router;
