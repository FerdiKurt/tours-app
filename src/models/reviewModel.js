const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
        review: {
            type: String,
            required: [true, 'Review cannot be empty!'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour', 
            required: [true, 'Review must belong to a tour!'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User', 
            required: [true, 'Review must belong to a user!'],
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

// query middleware: find()
reviewSchema.pre(/^find/, function (next) {
    const reviewsQuery = this
    reviewsQuery.populate({ 
        path: 'user',
        select: 'name photo'
    })

    next()
})

// static methods
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const reviewModel = this
    const stats = await reviewModel.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: { 
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating'}
            }
        }
    ])

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4,
        })
    }
}

// post middleware does not access to the 'next'
reviewSchema.post('save', function () {
    // this points current review
    this.constructor.calcAverageRatings(this.tour)
})

// query middleware: find()
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.reviewDocument = await this.findOne()
    next()
})

reviewSchema.post(/^findOneAnd/, async function () {
    // below does NOT work, query has already executed
    // this.reviewDocument = await this.findOne()
    await this.reviewDocument.constructor.calcAverageRatings(
        this.reviewDocument.tour
    )
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review

