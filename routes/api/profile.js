const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { validateProfile } = require('../../middleware/profileValidation');
const { validationErrors } = require('../../middleware/validationErrors');
const profileController = require('../../controllers/profileController');

router.get('/currentProfile', auth, profileController.currentProfile);

router.post('/createUpdate', [auth, validateProfile, validationErrors], profileController.profile);

router.get('/', auth, profileController.allProfiles);

router.delete('/delete', auth, profileController.deleteProfile);

module.exports = router;
