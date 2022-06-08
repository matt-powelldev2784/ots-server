const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { validateProfile } = require('../../middleware/profileValidation');
const { validationErrors } = require('../../middleware/validationErrors');
const profileController = require('../../controllers/profileController');

//---------------------------------------------------------------------
// @ route          GET api/profile/currentProfile
// @ description    Get current users profile
// @ access         Private
router.get('/currentProfile', auth, profileController.currentProfile);
//---------------------------------------------------------------------
// @ route          POST api/profile
// @ description    Create or update user profile
// @ access         Private
router.post('/createUpdate', [auth, validateProfile, validationErrors], profileController.profile);

//---------------------------------------------------------------------
// @ route          GET api/profile
// @ description    get all profiles
// @ access         Prviate
router.get('/', auth, profileController.allProfiles);

//---------------------------------------------------------------------
// @ route          DELETE api/profile
// @ description    DELETE profile & user
// @ access         Private
router.delete('/delete', auth, profileController.deleteProfile);

module.exports = router;
