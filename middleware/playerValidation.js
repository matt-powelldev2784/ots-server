const { check } = require('express-validator');
const mongoose = require('mongoose');

exports.validatePlayerRegister = [
    check('gameId', 'Error. gameId not found! Please proivide valid game id.').not().isEmpty(),
    check('gameId', 'Error. Invalid gameId. The objectID for the game is not found').custom((value, { req }) => {
        return mongoose.Types.ObjectId.isValid(value) === true;
    }),
    check('playerAvailable', 'Error. playerAvailable is a required field. Please supply a true or false value.').not().isEmpty(),
    check('playerAvailable', 'Error. playerAvailable should be boolean. Please supply a true or false value.').isBoolean()
];
