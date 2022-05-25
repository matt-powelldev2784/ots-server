const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    //get token from header
    const token = req.header('x-auth-token');

    //Check if not token
    if (!token) {
        return res.status(401).json({ msg: ' No token authorization denied' });
    }

    //Verify Token
    try {
        const decoded = jwt.verify(token, process.env.jwtSecret);

        req.user = decoded.user;
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Server Error. Token is not valid' });
    }
};
