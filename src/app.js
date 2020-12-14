const express = require('express')
const morgan = require('morgan')
require('./db/mongoose')

const APPError = require('./utils/APPError')
const globalErrorController = require('./controllers/errorController')
const tourRouter = require('./routers/tourRoutes')
const userRouter = require('./routers/userRoutes')

const app = express()

// 1) MIDDLEWARES
app.use(express.json()) // make body available on req

if (process.env.NODE_ENV === 'development') {
    app.use(express.static(`${__dirname}/../public`))
    app.use(morgan('dev'))
}

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
