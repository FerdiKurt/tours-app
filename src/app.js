const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
require('./db/mongoose')

const APPError = require('./utils/APPError')
const globalErrorController = require('./controllers/errorController')
const tourRouter = require('./routers/tourRoutes')
const userRouter = require('./routers/userRoutes')

const app = express()

// 1) GLOBAL MIDDLEWARES
app.use(express.json()) // make body available on req

if (process.env.NODE_ENV === 'development') {
    app.use(express.static(`${__dirname}/../public`))
    app.use(morgan('dev'))
}

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, try again in an hour!'
})

app.use('/api', limiter)

// 2) ROUTES
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

// undefined route handler
app.all('*', (req, res, next) => {
    next(new APPError(`Can't get ${req.originalUrl}`, 404))
})

// global error handler
app.use(globalErrorController)

module.exports = app
