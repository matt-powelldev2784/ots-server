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
// @ route          POST api/games/registerforgame
// @ description    Register for game
// @ access         Private
router.post(
    '/registerforgame',
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

            return res.status(500).json({ msg: 'Unable to register player for game at api route /games/registerforgame' });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error. Unhandled error at api route /games/registerforgame');
        }
    }
);

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
// @ route          POST api/games/setregister
// @ description    Open or close register
// @ access         Private
router.post(
    '/setregister',
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
// @ route          POST api/games/playerstatus
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

//---------------------------------------------------------------------
// @ route          POST api/games/tesdt
// @ description    test
// @ access         Private

router.get(
    '/test',
    [auth, [check('gameId', 'Error. Game not found! Please proivide valid game id.').not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { gameId, available } = req.body;
            const user = await User.findById(req.user.id).select('-password').select('-date');
            const userId = user._id.toString();

            const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
            if (!user) {
                return res.json({ msg: 'Profile not found. Please ensure active user is logged in' });
            }

            //await Game.find(gameId, { $pull: { playersAvailable: userProfileAvialable } });
            //const test = await Game.find({ _id: { $eq: gameId } });
            //const test = await Game.find({ $and: [{ _id: { $eq: gameId } }] });
            //const test = await Game.find({ playersAvailable: { $elemMatch: { _id: ObjectId('62449c1d9f14781507828bbf') } } });
            //const test = await Game.find({
            // $and: [{ _id: { $eq: gameId } }, { playersAvailable: { $elemMatch: { _id: ObjectId('62449c209f14781507828bc8') } } }]
            //});
            //const test = await Game.find({
            //    $and: [{ _id: { $eq: gameId } }, { playersAvailable: { $elemMatch: { _id: ObjectId(userId) } } }]
            //});
            // const test2 = await Game.findByIdAndUpdate(gameId, {
            //     $cond: {
            //         if: { playersAvailable:  { _id: ObjectId(userId) }  },
            //         then: { $pull: { playersAvailable: { _id: ObjectId(userId) } } },
            //         else: { $pull: { playersAvailable: { _id: ObjectId(userId) } } }
            //     }
            // });

            const test = await Game.find({
                $and: [
                    { _id: { $eq: gameId } },
                    {
                        $or: [
                            { playersAvailable: { $elemMatch: { _id: ObjectId(userId) } } },
                            { playersUnavailable: { $elemMatch: { _id: ObjectId(userId) } } }
                        ]
                    }
                ]
            });

            // const playerAvailable = await Game.findByIdAndUpdate(gameId, {
            //     $cond: { if: { playersAvailable: { $elemMatch: { _id: ObjectId(userId) } } } }
            // });

            const test2 = await Game.find()
                .where('playerAvailable')
                .equals({ _id: ObjectId(userId) });

            //const test2 = await Game.findByIdAndUpdate(gameId, { $pull: { playersAvailable: { _id: ObjectId(userId) } } });

            //const gameDetails = await Game.find({ gameDate: { $gte: last14Days, $lte: forward1Year } }).sort('-gameDate');

            return res.json({
                test2
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error. Unhandled error at api route /games/test');
        }
    }
);

module.exports = router;
