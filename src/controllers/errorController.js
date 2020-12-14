const AppError = require('../utils/APPError')

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err => {
    const message = `Duplicate field value: ${err.keyValue['name']}. Please use another value!`
    return new AppError(message, 400)
}

const handleValidationError = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message, 400)
}

const sendErrDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    })
}

const sendErrProd = (err, res) => {
    // operational, trusted error: send message to client
    if (err.isOperational) {
        if (!err.message) {
            err.message = 'Something is wrong with the provided request'
        }
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    }
    // programming or unknown error: don't leak error details
    else {
        console.error('ERROR', err._message)
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'Error occured!'

    if (process.env.NODE_ENV === 'development') {
        sendErrDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {
        let occuredError = { ...err }

        if (occuredError.reason) {
            occuredError = handleCastErrorDB(occuredError)
        } else if (occuredError.code === 11000) {
            occuredError = handleDuplicateFieldsDB(occuredError)
        } else if ((occuredError._message = 'Validation failed')) {
            occuredError = handleValidationError(occuredError)
        }

        sendErrProd(occuredError, res)
    }
}
