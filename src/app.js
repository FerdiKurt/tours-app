const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

require('./db/mongoose')

const APPError = require('./utils/APPError')
const globalErrorController = require('./controllers/errorController')
const tourRouter = require('./routers/tourRoutes')
const userRouter = require('./routers/userRoutes')
const reviewRouter = require('./routers/reviewRoutes')

const app = express()

// 1) GLOBAL MIDDLEWARES
// set security HTTP headers
app.use(helmet())

// body parser, reading data from body into req.body
// make body available on req
app.use(express.json(
    { limit: '10kb' }
)) 

// data sanitization against NOSQL query injection
app.use(mongoSanitize())

// data sanitization agains XSS
app.use(xss())

// prevent parameter solution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsAverage',
        'ratingsQuantity',
        'maxGroupSize',
        'difficulty',
        'price',
    ]
}))

// development logging and static asset for testing purposes
if (process.env.NODE_ENV === 'development') {
    app.use(express.static(`${__dirname}/../public`))
    app.use(morgan('dev'))
}

// limiting the number of request from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, try again in an hour!'
})

app.use('/api', limiter)

// 2) ROUTES
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

// undefined route handler
app.all('*', (req, res, next) => {
    next(new APPError(`Can't get ${req.originalUrl}`, 404))
})

// global error handler
app.use(globalErrorController)

module.exports = app
