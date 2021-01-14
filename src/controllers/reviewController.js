const Review = require('../models/reviewModel')
const APIFeatures = require('../utils/APIFeatures')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/APPError')

exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {}
    if (req.params.tourId) filter = { tour: req.params.tourId }

    const features = new APIFeatures(Review.find(filter), req.query)
        .filter()
        .sort()
        .limit()
        .paginate()
    
    const reviews = await features.query

    // send response
    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    })

})

exports.createReview = catchAsync(async (req, res, next) => {
    // allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id
    // console.log(req.user)

    const newReview = await Review.create(req.body)

    res.status(201).json({
        status: 'success',
        data: {
            review: newReview
        }
    })
})