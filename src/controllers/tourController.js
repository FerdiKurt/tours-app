const Tour = require('../models/tourModel')

exports.getAllTours = async (req, res) => {
    try {
        // build query
        // filtering
        const queryOBJ = { ...req.query }
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryOBJ[el])

        // advanced filtering
        let querySTR = JSON.stringify(queryOBJ).replace(
            /\b(gte|gt|lt|lte)\b/g,
            match => `$${match}`
        )

        let query = Tour.find(JSON.parse(querySTR))

        // sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ')
            query = query.sort(sortBy)
        } else {
            query = query.sort('-createdAt')
        }

        // execute query
        const tours = await query

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
            data: newTour,
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
