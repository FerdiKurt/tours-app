const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/APPError')
const factory = require('./handlerFactory')

const filterObj = (obj, ...opts) => {
    const newObj = {}

    Object.keys(obj).forEach(key => {
        if (opts.includes(key)) {
            newObj[key] = obj[key]
        }
    })

    return newObj
}

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead!'
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

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id

    next()
}
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false })

  res.status(204).json({
      status: 'success',
      data: null
  })
})

// Do NOT update password with this
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
