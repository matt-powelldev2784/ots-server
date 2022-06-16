const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const User = require('../models/User');
const res = require('express/lib/response');
const apiError = require('./apiError');
const catchAsyncErrors = require('./catchAsyncErrors');

exports.currentProfile = catchAsyncErrors(async (req, res) => {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
    if (!profile) {
        throw new apiError('Profile not found', 400);
    }

    return res.status(200).json({ success: true, status: 200, profile });
});

exports.profile = catchAsyncErrors(async (req, res) => {
    const { defaultTeam, position } = req.body;
    const profileData = { user: req.user.id, defaultTeam, position };
    const updateProfile = await Profile.findOne({ user: req.user.id });

    if (updateProfile) {
        const updatedProfile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileData }, { new: true });
        return res.status(200).json({ success: true, status: 200, updatedProfile });
    }

    const newProfile = new Profile(profileData);
    await newProfile.save();
    return res.status(201).json({ success: true, status: 200, newProfile });
});

exports.allProfiles = catchAsyncErrors(async (req, res) => {
    const profiles = await Profile.find().populate('user', ['name', 'email']);
    return res.status(200).json({ success: true, status: 200, profiles });
});

exports.deleteProfile = catchAsyncErrors(async (req, res) => {
    await Profile.findOneAndRemove({ user: req.user.id });

    await User.findOneAndRemove({ _id: req.user.id });

    return res.status(200).json({ success: true, status: 200, msg: 'User deleted' });
});
