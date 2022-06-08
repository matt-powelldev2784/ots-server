const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { validateRegisterUser } = require('../../middleware/userValidation');
const { validationErrors } = require('../../middleware/validationErrors');

//---------------------------------------------------------------------
// @ route          POST api/users
// @ description    Register user
// @ access         Public
router.post('/', [validateRegisterUser, validationErrors], async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, status: 400, errors: [{ msg: 'User already exists.' }] });
        }

        const user = new User({ name, email, password });

        //Encrypt Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        //Return jsonwebtoken
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.jwtSecret, { expiresIn: 360000 }, (err, token) => {
            if (err) {
                throw err;
            }
            res.status(201).json({ success: true, status: 201, token });
        });
    } catch (err) {
        console.error(err.message);
        return res
            .status(500)
            .send({ success: false, status: 500, errors: [{ msg: 'Server Error. Unhandled error at api route /users' }] });
    }
});

module.exports = router;
