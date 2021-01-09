const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [40, 'Max name length is 40 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be longer than 8'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // this only works on CREATE, SAVE!!!
            validator: function(pass) {
                return pass === this.password
            },
            message: 'Password are not the same!',
        },
    },
    // TODO: security issues, check passwordChangedAt field
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpiresAt: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    }
})

// document middleware
userSchema.pre('save', async function (next) {
    // only run if password is modified
    const user = this
    if (!user.isModified('password')) return next()
    // hash the password, delete passwordConfirm field
    user.password = await bcrypt.hash(user.password, 12)
    user.passwordConfirm = undefined

    next()
})

userSchema.pre('save', function (next) {
    const user = this
    if (!user.isModified('password') || user.isNew) return next();
    // TODO: check this part again
    user.passwordChangedAt = Date.now() - 3000;
    next();
});

// query middleware
userSchema.pre(/^find/, function (next) {
    const user = this
    // this points current query
    user.find({ active: { $ne: false } })
    next()
})

userSchema.methods.correctPassword = async function(givenPassword, userPassword) {
    return await bcrypt.compare(givenPassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const passwordChangedTimeStamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        // console.log(JWTTimestamp, passwordChangedTimeStamp)
        
        return JWTTimestamp < passwordChangedTimeStamp
    }

    // false means password is NOT changed
    return false
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
    
    // console.log({resetToken}, this.passwordResetToken)

    this.passwordResetExpiresAt = Date.now() + (10 * 60 * 1000)

    return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User
