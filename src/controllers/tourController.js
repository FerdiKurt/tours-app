const Tour = require('../models/tourModel')
const APIFeatures = require('../utils/APIFeatures')

exports.getFiveCheap = async (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = 'ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'

    next()
}

exports.getAllTours = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message,
        })
    }
}

exports.getTour = async (req, res) => {
    const _id = req.params.id

    try {
        const tour = await Tour.findById(_id)

        res.status(200).json({
            status: 'success',
            data: {
                tour,
            },
        })
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message,
        })
    }
}

exports.createTour = async (req, res) => {
    try {
        const newTour = await Tour.create(req.body)

        res.status(201).json({
            status: 'success',
            data: {
                newTour,
            },
        })
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}

exports.updateTour = async (req, res) => {
    const _id = req.params.id

    try {
        const updatedTour = await Tour.findByIdAndUpdate(_id, req.body, {
            new: true,
            runValidators: true,
        })

        res.status(201).json({
            status: 'success',
            data: {
                updatedTour,
            },
        })
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}

exports.deleteTour = async (req, res) => {
    const _id = req.params.id

    try {
        await Tour.findByIdAndDelete(_id)

        res.status(204).json({
            status: 'success',
            data: null,
        })
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}

exports.getTourStats = async (req, res) => {
    try {
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
            { $match: { _id: { $ne: 'EASY' } } },
        ])

        res.status(200).json({
            status: 'success',
            data: {
                stats,
            },
        })
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}

exports.getMonthlyPlan = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}
