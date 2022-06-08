const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { validatePlayerRegister } = require('../../middleware/playerValidation');
const { validationErrors } = require('../../middleware/validationErrors');
const playerContoller = require('../../controllers/playerContoller');

//---------------------------------------------------------------------
// @ route          POST api/player/playerRegister
// @ description    Register player available or unavailable for game
// @ access         Private
router.post('/playerRegister', [auth, validatePlayerRegister, validationErrors], playerContoller.playerRegisterForGame);

module.exports = router;
