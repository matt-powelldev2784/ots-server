const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { ObjectId } = require('mongodb')
const Game = require('../models/Game')
const apiError = require('./apiError')
const catchAsyncErrors = require('./catchAsyncErrors')

exports.playerRegisterForGame = catchAsyncErrors(async (req, res, next) => {
    const gameId = await req.body.gameId

    const game = await Game.findById(gameId)
    if (game.gameClosed) {
        throw new apiError('Registration for this game is now closed', 400)
    }

    const user = await User.findById(req.user.id).select('-password').select('-date')
    if (!user) {
        throw new apiError('Cannot find user', 403)
    }

    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email'])
    if (!profile) {
        throw new apiError("Cannot find user's profile", 403)
    }

    const profileId = profile._id
    const playerAvailable = JSON.parse(req.body.playerAvailable)
    if (playerAvailable) {
        await Game.findByIdAndUpdate(gameId, { $push: { playersAvailable: { ...profile } } })
        return res
            .status(200)
            .json({ success: true, status: 200, msg: 'The following user has registered available', profile })
    }

    if (!playerAvailable) {
        await Game.findByIdAndUpdate(gameId, { $pull: { playersAvailable: { _id: profileId } } })
        return res.status(200).json({
            success: true,
            status: 200,
            msg: 'The following user has registered unavailable',
            profile
        })
    }
})
