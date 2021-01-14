const Tour = require('../models/tourModel')
const APIFeatures = require('../utils/APIFeatures')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/APPError')

exports.getFiveCheap = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = 'ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'

    next()
}

exports.getAllTours = catchAsync(async (req, res, next) => {
    // execute query
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limit()
        .paginate()

    const tours = await features.query

    // send response
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours,
        },
    })
})

exports.getTour = catchAsync(async (req, res, next) => {
    const _id = req.params.id
    const tour = await Tour.findById(_id).populate('reviews');

    if (!tour) {
        return next(new AppError('No Tour found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour,
        },
    })
})

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body)

    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour,
        },
    })
})

exports.updateTour = catchAsync(async (req, res, next) => {
    const _id = req.params.id

    const updatedTour = await Tour.findByIdAndUpdate(_id, req.body, {
        new: true,
        runValidators: true,
    })

    if (!updatedTour) {
        return next(new AppError('No Tour found with that ID', 404))
    }

    res.status(201).json({
        status: 'success',
        data: {
            updatedTour,
        },
    })
})

exports.deleteTour = catchAsync(async (req, res, next) => {
    const _id = req.params.id

    const deleteTour = await Tour.findByIdAndDelete(_id)
    if (!deleteTour) {
        return next(new AppError('No Tour found with that ID', 404))
    }

    res.status(204).json({
        status: 'success',
        data: null,
    })
})

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        { $match: { ratingsAverage: { $gte: 4.3 } } },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numOfTours: { $sum: 1 },
                numOfRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: { avgPrice: 1 },
        },
        // { $match: { _id: { $ne: 'EASY' } } },
    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    })
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = +req.params.year // 2021

    const plan = await Tour.aggregate([
        { $unwind: '$startDates' },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lt: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numOfTourStarts: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },
        {
            $addFields: { month: '$_id' },
        },
        {
            $project: { _id: 0 },
        },
        {
            // $sort: { month: 1 },
            $sort: { numOfTourStarts: -1 },
        },
        {
            $limit: 12,
        },
    ])

    res.status(200).json({
        status: 'success',
        data: {
            plan,
        },
    })
})
