const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const User = require('../models/User');
const res = require('express/lib/response');

exports.currentProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email']);

        if (!profile) {
            return res.status(400).json({ success: false, status: 400, errors: [{ msg: 'Unable to retrieve profile' }] });
        }

        return res.status(200).json({ success: true, status: 200, profile });
    } catch (err) {
        console.error(err.message);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /profile/me' }] });
    }
};

exports.profile = async (req, res) => {
    const { defaultTeam, position } = req.body;
    const profileData = { user: req.user.id, defaultTeam, position };

    try {
        const updateProfile = await Profile.findOne({ user: req.user.id });

        if (updateProfile) {
            const updatedProfile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileData }, { new: true });
            return res.status(200).json({ success: true, status: 200, updatedProfile });
        }

        const newProfile = new Profile(profileData);
        await newProfile.save();
        return res.status(201).json({ success: true, status: 200, newProfile });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /api/profile' }] });
    }
};

exports.allProfiles = async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'email']);
        return res.status(200).json({ success: true, status: 200, profiles });
    } catch (err) {
        console.error(err.message);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /api/profile' }] });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        await Profile.findOneAndRemove({ user: req.user.id });

        await User.findOneAndRemove({ _id: req.user.id });

        return res.status(200).json({ success: true, status: 200, msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /api/profile' }] });
    }
}
