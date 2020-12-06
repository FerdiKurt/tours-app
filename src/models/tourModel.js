const mongoose = require('mongoose')
const slugify = require('slugify')

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            unique: true,
            trim: true,
        },
        duration: {
            type: Number,
            required: [true, 'Duration is required'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'MaxGroupSize is required'],
        },
        difficulty: {
            type: String,
            required: [true, 'Difficulty is required'],
        },
        ratingsAverage: {
            type: Number,
            default: 4,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
        },
        priceDiscount: Number,
        summary: {
            type: String,
            trim: true,
            required: [true, 'Summary is required'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'Image is required'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        slug: String,
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

// virtuals can not be used with query methods since they are virtual
tourSchema.virtual('durationInWeeks').get(function() {
    const tour = this

    return tour.duration / 7
})

// document middlewares: runs before save(), create()
tourSchema.pre('save', function() {
    const tour = this

    tour.slug = slugify(tour.name, { lower: true })
    next()
})

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour
