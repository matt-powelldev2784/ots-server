const { check } = require('express-validator');

exports.validateProfile = [
    check('defaultTeam', 'Please include a default team').not().isEmpty(),
    check('position', 'Please include a default position').not().isEmpty()
];
