const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/APPError')

const filterObj = (obj, ...opts) => {
    const newObj = {}

    Object.keys(obj).forEach(key => {
        if (opts.includes(key)) {
            newObj[key] = obj[key]
        }
    })

    return newObj
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()

  // send response
  res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      },
  })
})

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
}

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
}

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
}

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
}

exports.updateMe = catchAsync(async (req, res, next) => {
    // create error if user posts password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError(
            'This route is not for password updates!', 
            400
        ))
    }

    // update user document, filter out unwanted fields
    const filteredBody = filterObj(req.body, 'name', 'email')
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        new: true,
        runValidators: true
    })
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false })

    res.status(204).json({
        status: 'success',
        data: null
    })
})