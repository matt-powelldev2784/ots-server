require('dotenv').config();
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
    validateGameAvailability,
    validateCreateGame,
    validateDeleteGame,
    validateSetGameRegister,
    validateFinalTeam
} = require('../../middleware/gameValidation');
const { validationErrors } = require('../../middleware/validationErrors');
const User = require('../../models/User');
const Game = require('../../models/Game');
const setGamesController = require('../../controllers/setGamesCotroller');
const getGamesController = require('../../controllers/getGamesController');


router.get('/recentGames', auth, getGamesController.recentGames);

router.get('/planTeamData/:id', [auth, validateGameAvailability, validationErrors], getGamesController.planTeamData);

router.post('/createGame', [auth, validateCreateGame, validationErrors], setGamesController.createGame);

router.delete('/deleteGame/:id', [auth, validateDeleteGame, validationErrors], setGamesController.deleteGame);

router.post('/gameRegister', [auth, validateSetGameRegister, validationErrors], setGamesController.gameRegister);

router.post('/updateFinalTeam', [auth, validateFinalTeam, validationErrors], setGamesController.updateFinalTeam);

module.exports = router;
