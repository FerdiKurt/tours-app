const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/APPError')
const APIFeatures = require('../utils/APIFeatures')

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body)

    res.status(201).json({
        status: 'success',
        data: {
            data: doc,
        },
    })
})

exports.getOne = (Model, populateOptions) => catchAsync(async (req, res, next) => {
    const _id = req.params.id
    let query = Model.findById(_id)

    if (populateOptions) {
        query = query.populate(populateOptions)
    }

    const doc = await query;
    if (!doc) {
        return next(new AppError('No document found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc,
        },
    })
})

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const _id = req.params.id

    const doc = await Model.findByIdAndDelete(_id)
    if (!doc) {
        return next(new AppError('No document found with that ID', 404))
    }

    res.status(204).json({
        status: 'success',
        data: null,
    })
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const _id = req.params.id

    const doc = await Model.findByIdAndUpdate(_id, req.body, {
        new: true,
        runValidators: true,
    })

    if (!doc) {
        return next(new AppError('No document found with that ID', 404))
    }

    res.status(201).json({
        status: 'success',
        data: {
            data: doc,
        },
    })
})

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // to allow for nested GET reviews on Tour
    let filter = {}
    if (req.params.tourId) filter = { tour: req.params.tourId }

    // execute query
    const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limit()
    .paginate()

    // const docs = await features.query.explain()
    const docs = await features.query

    // send response
    res.status(200).json({
        status: 'success',
        results: docs.length,
        data: {
            data: docs,
        },
    })
})