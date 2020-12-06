class APIFeatures {
    constructor(query, queryVal) {
        this.query = query
        this.queryVal = queryVal
    }

    filter() {
        const queryOBJ = { ...this.queryVal }
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryOBJ[el])

        // advanced filtering
        let querySTR = JSON.stringify(queryOBJ).replace(
            /\b(gte|gt|lt|lte)\b/g,
            match => `$${match}`
        )

        this.query = this.query.find(JSON.parse(querySTR))

        return this
    }

    sort() {
        if (this.queryVal.sort) {
            const sortBy = this.queryVal.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt')
        }

        return this
    }

    limit() {
        if (this.queryVal.fields) {
            const requestedFields = this.queryVal.fields.split(',').join(' ')
            this.query = this.query.select(requestedFields)
        } else {
            this.query = this.query.select('-__v')
        }

        return this
    }

    paginate() {
        const page = +this.queryVal.page || 1
        const limit = +this.queryVal.limit || 20
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit)

        return this
    }
}

module.exports = APIFeatures
