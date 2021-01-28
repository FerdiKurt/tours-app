const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/APPError')
const factory = require('./handlerFactory')

exports.getFiveCheap = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = 'ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'

    next()
}

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

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/distance/100/center/-60,120/unit/:km
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params
    const [lat, lng] = latlng.split(',')
    const radius =
        (unit === 'mi' ? distance / 3963.2 : distance / 6378.1);

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude!',
                400
            )
        )
    }

    const tours = await Tour.find({
            startLocation: {
                $geoWithin: { 
                    $centerSphere: [[lng, lat], radius]        
                }
            }
        }
    )
    
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    })
})

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, { path: 'reviews' })
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)
