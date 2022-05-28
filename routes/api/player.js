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
// @ route          POST api/player/registerforgame
// @ description    Player Register for game
// @ access         Private
router.post(
    '/playerregisterforgame',
    [
        auth,
        [
            check('gameId', 'Error. gameId not found! Please proivide valid game id.').not().isEmpty(),
            check('gameId', 'Error. Invalid gameId. The objectID for the game is not found').custom((value, { req }) => {
                return mongoose.Types.ObjectId.isValid(value) === true;
            }),
            check('playerAvailable', 'Error. playerAvailable is a required field. Please supply a true or false value.').not().isEmpty(),
            check('playerAvailable', 'Error. playerAvailable should be boolean. Please supply a true or false value.').isBoolean()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const gameId = await req.body.gameId;

            const game = await Game.findById(gameId);
            if (!game) {
                return res.json({ msg: 'game not found. Please provide valid objectId for the game.' });
            }

            if (game.gameClosed) {
                return res.json({ msg: 'Registration for this game is now closed.' });
            }

            const user = await User.findById(req.user.id).select('-password').select('-date');
            if (!user) {
                return res.json({ msg: 'User not found. Please ensure active user is logged in' });
            }

            const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
            if (!user) {
                return res.json({ msg: 'Profile not found. Please ensure active user is logged in' });
            }

            const { _id, name, email } = user;
            const { position, defaultTeam } = profile;
            const userProfileAvialable = { _id, name, email, position, defaultTeam, available: true };
            const userProfileUnavailable = { _id, name, email, position, defaultTeam, available: false };

            const playerAvailable = JSON.parse(req.body.playerAvailable);
            if (playerAvailable === true) {
                await Game.findByIdAndUpdate(gameId, { $push: { playersAvailable: userProfileAvialable } });
                await Game.findByIdAndUpdate(gameId, { $pull: { playersUnavailable: userProfileUnavailable } });
                return res.json({ msg: 'The following user has registered available', user: { userProfileAvialable } });
            }
            if (playerAvailable === false) {
                await Game.findByIdAndUpdate(gameId, { $push: { playersUnavailable: userProfileUnavailable } });
                await Game.findByIdAndUpdate(gameId, { $pull: { playersAvailable: userProfileAvialable } });
                return res.json({ msg: 'The following user has registered unavailable', user: { userProfileUnavailable } });
            }

            return res.status(500).json({ msg: 'Unable to register player for game at api route /games/playerregisterforgame' });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error. Unhandled error at api route /games/playerregisterforgame');
        }
    }
);

//---------------------------------------------------------------------
// @ route          POST api/player/playerstatus
// @ description    Check if player is registered for game
// @ access         Private
router.post(
    '/playerstatus',
    [auth, [check('gameId', 'Error. Game not found! Please proivide valid game id.').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { gameId } = req.body;
            const userId = req.user.id;

            const user = await User.findById(userId).select('-password');
            if (!user) {
                return res.json({ msg: 'User not found. Please ensure active user is logged in' });
            }

            const gameDetails = await Game.findById(gameId);
            if (!gameDetails) {
                return res.json({ msg: 'gameDetails not found. Please provide valid objectId for the game.' });
            }

            const playerAvailable = await Game.findById(gameId)
                .where('playersAvailable')
                .elemMatch({ _id: mongoose.Types.ObjectId(userId) });

            if (playerAvailable) {
                const playerAndGame = {
                    msg: 'The following player is available for the game',
                    user: { _id: user._id, name: user.name },
                    game: { _id: gameDetails._id, name: gameDetails.gameName },
                    available: true,
                    notRegistered: false
                };
                return res.json(playerAndGame);
            }

            const playerUnavailable = await Game.findById(gameId)
                .where('playersUnavailable')
                .elemMatch({ _id: mongoose.Types.ObjectId(userId) });
            if (playerUnavailable) {
                const playerAndGame = {
                    msg: 'The following player is unavailable for the game',
                    user: { _id: user._id, name: user.name },
                    game: { _id: gameDetails._id, name: gameDetails.gameName },
                    available: false,
                    notRegistered: false
                };
                return res.json(playerAndGame);
            }

            const playerAndGame = {
                msg: 'The player has not registered',
                user: { _id: user._id, name: user.name },
                game: { _id: gameDetails._id, name: gameDetails.gameName },
                available: false,
                notRegistered: true
            };
            return res.json(playerAndGame);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error. Unhandled error at api route /games/playerStatus');
        }
    }
);

module.exports = router;
