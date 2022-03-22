const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const res = require('express/lib/response');

//---------------------------------------------------------------------
// @ route          GET api/profile/me
// @ description    Get current users profile
// @ access         Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email']);

        if (!profile) {
            return res.status(400).json({ errors: [{ msg: 'Please fill in profile information' }] });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//---------------------------------------------------------------------
// @ route          POST api/profile
// @ description    Create or update user profile
// @ access         Private
router.post(
    '/',
    [
        auth,
        [
            check('defaultTeam', 'Please include a default team').not().isEmpty(),
            check('position', 'Please include a default position').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { defaultTeam, position } = req.body;
        const profileFields = { user: req.user.id, defaultTeam, position };

        try {
            let profile = await Profile.findOne({ user: req.user.id });

            if (profile) {
                profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
                return res.json(profile);
            }

            profile = new Profile(profileFields);
            await profile.save();
            return res.json(profile);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }

        res.status(200).send('Success');
    }
);

//---------------------------------------------------------------------
// @ route          GET api/profile
// @ description    get all profiles
// @ access         Prviate
router.get('/', auth, async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'email']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//---------------------------------------------------------------------
// @ route          DELETE api/profile
// @ description    DELETE profile & user
// @ access         Private
router.delete('/', auth, async (req, res) => {
    try {
        //Remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //Remove User
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;