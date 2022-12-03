const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db.js')
const path = require('path')

const app = express()
connectDB()

app.use(express.json({ extended: false }))

app.use(
    cors({
        credentials: true,
        origin: true
    })
)

app.use('/api/users', require('./routes/api/users'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/profile', require('./routes/api/profile'))
app.use('/api/games', require('./routes/api/games'))
app.use('/api/player', require('./routes/api/player'))
app.use('/api/test', require('./routes/api/test'))

app.use((err, req, res, next) => {
    console.log(err)
    res.status(err.status || 500).json({
        success: false,
        status: err.status || 500,
        errors: [{ msg: err.message || 'NodeJS Server Error' }]
    })
})

app.use(express.static(path.join(__dirname, '../client/build')))

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'))
})

const PORT = process.env.PORT || 8000

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
