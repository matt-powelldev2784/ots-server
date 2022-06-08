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

//---------------------------------------------------------------------
// @ route          GET api/games/recentGames
// @ description    Get all recent games
// @ access         Private
router.get('/recentGames', auth, getGamesController.recentGames);

//---------------------------------------------------------------------
// @ route          GET api/games/planTeamData
// @ description    Get player availability for a specific game so teams can be planned
// @ access         Private
router.get('/planTeamData/:id', [auth, validateGameAvailability, validationErrors], getGamesController.planTeamData);

//---------------------------------------------------------------------
// @ route          POST api/games/createGame
// @ description    Create game
// @ access         Private
router.post('/createGame', [auth, validateCreateGame, validationErrors], setGamesController.createGame);

//---------------------------------------------------------------------
// @ route          DELETE api/games/deleteGame
// @ description    Delete game
// @ access         Private
router.delete('/deleteGame/:id', [auth, validateDeleteGame, validationErrors], setGamesController.deleteGame);

//---------------------------------------------------------------------
// @ route          POST api/games/setgameregister
// @ description    Open a game to allow players to register or close the game to stop any players registering
// @ access         Private
router.post('/gameRegister', [auth, validateSetGameRegister, validationErrors], setGamesController.setGameRegister);

//---------------------------------------------------------------------
// @ route          POST api/games/updatefinalteam
// @ description    Save players to specified to team
// @ access         Private
router.post('/updateFinalTeam', [auth, validateFinalTeam, validationErrors], setGamesController.updateFinalTeam);

module.exports = router;
