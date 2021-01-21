const Review = require('../models/reviewModel')
// const APIFeatures = require('../utils/APIFeatures')
// const catchAsync = require('../utils/catchAsync')
// const AppError = require('../utils/APPError')
const factory = require('./handlerFactory')

exports.setIds = (req, res, next) => {
    // allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id
    
    next()
}

exports.getAllReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.createReview = factory.createOne(Review)
exports.updateReview = factory.updateOne(Review)
exports.deleteReview = factory.deleteOne(Review)