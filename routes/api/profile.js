const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { validateProfile } = require('../../middleware/profileValidation')
const { validationErrors } = require('../../middleware/validationErrors')
const profileController = require('../../controllers/profileController')

router.get('/currentProfile', auth, profileController.currentProfile)

router.post('/updateProfile', [auth, validateProfile, validationErrors], profileController.updateProfile)

router.post('/newProfile', [auth, validateProfile, validationErrors], profileController.newProfile)

router.get('/', auth, profileController.allProfiles)

router.delete('/delete', auth, profileController.deleteProfile)

module.exports = router
