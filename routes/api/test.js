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
// @ route          POST api/games/test
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
