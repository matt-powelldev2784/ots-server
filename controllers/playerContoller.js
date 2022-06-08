const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const Game = require('../models/Game');

exports.playerRegisterForGame = async (req, res) => {
    try {
        const gameId = await req.body.gameId;

        const game = await Game.findById(gameId);
        if (!game) {
            return res
                .status(400)
                .json({ success: false, status: 400, errors: [{ msg: 'game not found. Please provide valid objectId for the game.' }] });
        }

        if (game.gameClosed) {
            return res.status(400).json({ success: false, status: 400, errors: [{ msg: 'Registration for this game is now closed.' }] });
        }

        const user = await User.findById(req.user.id).select('-password').select('-date');
        if (!user) {
            return res.status(403).json({
                success: false,
                status: 403,
                errors: [{ msg: 'User not authorised. Please login with authorised user' }]
            });
        }

        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
        if (!user) {
            return res
                .status(403)
                .json({ success: false, status: 403, errors: [{ msg: 'Profile not found. Please login with authorised user' }] });
        }

        const profileId = profile._id;

        const playerAvailable = JSON.parse(req.body.playerAvailable);
        if (playerAvailable) {
            await Game.findByIdAndUpdate(gameId, { $push: { playersAvailable: { ...profile } } });
            return res.status(200).json({ success: true, status: 200, msg: 'The following user has registered available', profile });
        }
        if (!playerAvailable) {
            await Game.findByIdAndUpdate(gameId, { $pull: { playersAvailable: { _id: profileId } } });
            return res.status(200).json({ success: true, status: 200, msg: 'The following user has registered unavailable', profile });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            success: false,
            status: 500,
            errors: [{ msg: 'Server Error. Unhandled error at api route /player/playerRegisterForGame' }]
        });
    }
};
