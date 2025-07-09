const crypto = require('crypto');

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'email required'],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImg: { type: String },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // not exposed in output
      validate: {
        validator: function (value) {
          // Only validate password for 'local' authProvider
          return this.authProvider === 'local' ? !!value : true;
        },
        message: 'A password is required for local authentication',
      },
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ['user', 'manager', 'admin'],
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
    },
    //child reference
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
      },
    ],
    addresses: [
      {
        id: mongoose.Schema.Types.ObjectId,
        alias: String,
        details: String,
        phone: String,
        city: String,
        postalCode: String,
      },
    ],
  },
  { timestamps: true },
);

// check if two password are correct
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  if (!candidatePassword || !userPassword) {
    throw new Error('Password values cannot be undefined');
  }
  return await bcrypt.compare(candidatePassword, userPassword);
};

// check if the user changed the password after a given time
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp; // if true then the password has been changed after jwt token was issued
  }
  // false means not changed
  return false;
};

// create a random code and save hashed version into db
userSchema.methods.createPasswordResetCode = function () {
  //create random code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  //hash the code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  // save relative data to db
  this.passwordResetCode = hashedResetCode;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  this.passwordResetVerified = false;

  return resetCode;
};

// Hashing user password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

//update passwordChangedAt field
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
}); //this.isNew  means the new document (user)

// respond only with active users
// userSchema.pre(/^find/, function (next) {
//   this.find({ active: true });
//   next();
// });

const User = mongoose.model('User', userSchema);

module.exports = User;
