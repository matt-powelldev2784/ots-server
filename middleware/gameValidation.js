const { check } = require('express-validator')
const mongoose = require('mongoose')

exports.validateGameAvailability = [
    check('id').not().isEmpty().withMessage('Error. Game not found! Please proivide valid game id.'),
    check('id')
        .custom((value, { req }) => {
            return mongoose.Types.ObjectId.isValid(value) === true
        })
        .withMessage('Error. Invalid gameId. The objectID for the game is not found')
]

exports.validateCreateGame = [
    check('gameDate', 'Error. Game Date is a required field').not().isEmpty(),
    check('gameName', 'Error. Game Name is a required field').not().isEmpty(),
    check('gameName', 'Error. Game Name should be less than 20 characters').isLength({ max: 20 })
]

exports.validateDeleteGame = [
    check('id')
        .custom((value, { req }) => {
            return mongoose.Types.ObjectId.isValid(value) === true
        })
        .withMessage('Error. Invalid gameId. The objectID for the game is not found')
]

exports.validateSetGameRegister = [
    check('gameId', 'Error. Game not found! Please proivide valid game id.').not().isEmpty(),
    check('gameClosed', 'Error. gameClosed is a required field. Please specify true or false')
        .not()
        .isEmpty()
        .isBoolean(),
    check('gameId', 'Error. Invalid gameId. The objectID for the game is not found').custom(
        (value, { req }) => {
            return mongoose.Types.ObjectId.isValid(value) === true
        }
    )
]

exports.validateFinalTeam = [
    check('gameId', 'Error. Game not found! Please proivide valid game id.').not().isEmpty(),
    check('gameId', 'Error. Invalid gameId. The objectID for the game is not found').custom(
        (value, { req }) => {
            return mongoose.Types.ObjectId.isValid(value) === true
        }
    ),
    check('finalTeam', 'Error. finalTeam must not be empty and must be an array.').not().isEmpty().isArray()
]
