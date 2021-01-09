const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/APPError')
const sendEmail = require('../utils/email')

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)

    const cookieOpts = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    }

    if (process.env.NODE_ENV === 'production') {
        cookieOpts.secure = true
    }
    
    res.cookie('jwt', token, cookieOpts)

    // remove password from the output
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        },
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    // TODO: change this part
    const newUser = await User.create(req.body)
    createAndSendToken(newUser, 201, res)      
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    // check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 404));
    }

    // check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password')

    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // if everything is ok, send token to the client
    createAndSendToken(user, 200, res)  
})

exports.protect = catchAsync(async (req, res, next) => {
    let token
    // getting token if it's exist and valid
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }
    // validate token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_KEY);
    
    // check if user still exists
    const expectedUser =  await User.findById(decoded.id)
    if (!expectedUser) {
        return next(new AppError(
            'User with given id does not exist',
            401
        ));
    }
    // check if user changed password after token is issued
    if (expectedUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password ! Please login again',
            401
        ));
    }
    
    // grant access to protected route
    req.user = expectedUser
    next()
})

exports.restrictTo = (...roles) => {
    return  (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError(
                'You do not have permission!',
                403
            ));
        }

        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with email address.', 404));
    }
  
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
  
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
  
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message
      });
  
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
  
      return next(
        new AppError('There was an error sending the email. Try again later!'),
        500
      );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: { $gt: Date.now() }
    })

    // if token has not expired, and there is a user, set the new password
    if (!user) {
        return next(new AppError(
            'Token is invalid or expired!', 
            400
        ))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpiresAt = undefined

    await user.save()

    // update changedPasswordAt property for the user
    // log the user in, send JWT
    createAndSendToken(user, 200, res)  
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // get user from collection
    const user = await User.findById(req.user.id).select('+password')

    // check if posted password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError(
            'Your current password is incorrect!',
            401
        ))
    }

    // if so, update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm

    await user.save()

    // log the user in, send JWT
    createAndSendToken(user, 200, res)  
})
