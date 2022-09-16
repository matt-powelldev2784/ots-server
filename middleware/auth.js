const jwt = require('jsonwebtoken')
const apiError = require('../controllers/apiError')

module.exports = function (req, res, next) {
    //get token from header
    const token = req.header('x-auth-token')

    //Check if not token
    if (!token) {
        return new apiError('No token authorization denied', 401)
    }

    //Verify Token
    try {
        const decoded = jwt.verify(token, process.env.jwtSecret)
        req.user = decoded.user
        next()
    } catch (err) {
        return new apiError('Server Error. Token is not valid', 401)
    }
}
