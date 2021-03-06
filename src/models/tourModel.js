const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator') // validation and sanitization just only on strings

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            unique: true,
            trim: true,
            maxlength: [40, 'Max name length is 40 characters'],
            minlength: [8, 'Min name length is 8 characters'],
            // validate: [validator.isAlpha, 'String contains invalid characters'],
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
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message:
                    'Difficulty must be one of "easy", "medium", "difficult"',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4,
            min: [1, 'Ratings must be greater than 1'],
            max: [5, 'Ratings must be smaller than 5'],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function(val) {
                    // this points to only current document on NEW document creation
                    return val < this.price
                },
                message:
                    'Discount price ({VALUE}) should be smaller than price',
            },
        },
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
        secretTour: {
            type: Boolean,
            default: false,
        },
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
tourSchema.pre('save', function(next) {
    const tourDocument = this

    tourDocument.slug = slugify(tourDocument.name, { lower: true })
    next()
})

// query middleware: find()
tourSchema.pre(/^find/, function(next) {
    const tourQuery = this
    tourQuery.find({ secretTour: { $ne: true } })

    // tour.start = Date.now()
    next()
})

// tourSchema.post(/^find/, function(docs, next) {
//     const tour = this
//     console.log(`${Date.now() - tour.start}`)
//     console.log(docs)
//     next()
// })

// aggregation middleware
tourSchema.pre('aggregate', function(next) {
    const aggregateObject = this
    aggregateObject
        .pipeline()
        .unshift({ $match: { secretTour: { $ne: true } } })
    // console.log(aggregateObject.pipeline())
    next()
})

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour
