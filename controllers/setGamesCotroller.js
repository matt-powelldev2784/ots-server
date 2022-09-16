require('dotenv').config()
const User = require('../models/User')
const Game = require('../models/Game')
const apiError = require('./apiError')
const catchAsyncErrors = require('./catchAsyncErrors')

exports.createGame = catchAsyncErrors(async (req, res) => {
    const { gameDate, gameName } = req.body
    const user = await User.findById(req.user.id).select('-password')
    if (!user.admin) {
        throw new apiError('User not authorised', 403)
    }

    await Game.create({ gameDate, gameName })

    return res.status(200).json({
        success: true,
        status: 200,
        msg: 'The following game has been created:',
        gameDate,
        gameName
    })
})

//---------------------------------------------------------------------

exports.deleteGame = catchAsyncErrors(async (req, res) => {
    const gameId = req.params.id

    const gameDetails = await Game.findById(gameId)

    const user = await User.findById(req.user.id).select('-password').select('-date')
    if (!user.admin) {
        throw new apiError('User not authorised', 403)
    }

    await Game.findByIdAndRemove(gameId)
    return res.status(200).json({
        success: true,
        status: 200,
        msg: 'The following game has been deleted:',
        gameName: gameDetails.gameName,
        gameDate: gameDetails.gameDate
    })
})

//---------------------------------------------------------------------

exports.gameRegister = catchAsyncErrors(async (req, res) => {
    const { gameId, gameClosed } = req.body

    const gameDetails = await Game.findById(gameId)

    const user = await User.findById(req.user.id).select('-password').select('-date')
    if (!user.admin) {
        throw new apiError('User not authorised', 403)
    }

    const finalTeam = gameDetails.playersAvailable
    await Game.findByIdAndUpdate(gameId, { $set: { gameClosed: gameClosed, finalTeam: finalTeam } })

    const closedGame = await Game.findById(gameId)
    return res.json({ success: false, status: 200, closedGame })
})

//---------------------------------------------------------------------

exports.updateFinalTeam = catchAsyncErrors(async (req, res) => {
    const { gameId, finalTeam } = req.body

    const user = await User.findById(req.user.id).select('-password').select('-date')
    if (!user.admin) {
        throw new apiError('User not authorised', 403)
    }

    await Game.findByIdAndUpdate(gameId, { $set: { finalTeam: finalTeam } })
    return res.status(200).json({
        success: false,
        status: 200,
        msg: 'The final Team has been updated with the data below:',
        gameId: gameId,
        finalTeam: finalTeam
    })
})
