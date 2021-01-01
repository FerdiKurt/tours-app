const AppError = require('../utils/APPError')

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`
    return new AppError(message, 400)
}

const handleValidationError = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message, 400)
}

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired. Please login again!', 401);

// development mode error handling route
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
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    }
    // programming or unknown error: don't leak error details
    else {
        console.error('ERROR', err.name)
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
      
        let error = Object.create(err)
        
        // TODO: validation error got problems in production mode
        // if (error.name = 'ValidationError') {
        //     error = handleValidationError(error)
        // }
       
        if (error.name === 'JsonWebTokenError'){ 
            error = handleJWTError();
        }
        if (error.name === 'TokenExpiredError'){ 
            error = handleJWTExpiredError();
        }
        if (error.message.includes('Cast')) {
            error = handleCastErrorDB(error)
        }
        if (error.code === 11000) {
            error = handleDuplicateFieldsDB(error)
        }
    
        sendErrProd(error, res)
    }
}
