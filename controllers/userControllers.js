// const slugify = require('slugify');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../utils/imageUpload');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const storage = multer.memoryStorage();
const upload = multer({ storage });
exports.uploadUserPhoto = upload.single('profileImg');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Convert the buffer to a base64 string
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  // Upload the base64 image directly to Cloudinary
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'users',
    public_id: `user-${req.user.id}-${Date.now()}`,
    format: 'jpg',
  });

  req.body.profileImg = result.secure_url; // Cloudinary URL

  console.log(`Image uploaded to Cloudinary, URL: ${result.secure_url}`);

  next();
});

// only admin will use these
exports.getAllUsers = factory.getAll(User, '', 'users');
exports.createUser = factory.createOne(User);
exports.getUser = factory.getOne(User);

// only admin can use this
exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  // Check if the role is valid
  const validRoles = ['user', 'admin', 'seller'];
  if (!validRoles.includes(role)) {
    return next(new AppError('Invalid role specified', 400));
  }

  // Update the user's role
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true },
  );

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getLoggedUserData = catchAsync(async (req, res, next) => {
  req.params.id = req.user._id;
  // to use the getUser() middleware fuction
  next();
});

exports.updateLoggedUserData = catchAsync(async (req, res, next) => {
  // prevent updating the password through this
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        'this route is not for updating password please use /updateMyPassword',
        400,
      ),
    );

  // to filter the body
  const filteredObj = filterObj(
    req.body,
    'name',
    'phone',
    'profileImg',
    'email',
  );
  const user = await User.findByIdAndUpdate(req.user._id, filteredObj, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(new AppError('Error, Please login again', 400));

  res.status(200).json({
    status: 'success',
    message: 'User data updated successfully',
    data: {
      user,
    },
  });
});

exports.updateLoggedUserPassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;

  if (!currentPassword)
    return next(new AppError(' Please  provide your current password', 400));
  if (!newPassword)
    return next(new AppError(' Please provide your new password', 400));
  if (!passwordConfirm)
    return next(new AppError(' Please confirm your password', 400));

  const user = await User.findById(req.user._id).select('+password');

  if (!user) return next(new AppError('Error, Please login again', 400));

  if (!(await user.correctPassword(currentPassword, user.password)))
    return next(new AppError('Incorrect current password', 400));

  if (passwordConfirm !== newPassword)
    return next(new AppError("Passwords don't match", 400));

  user.password = newPassword;

  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('JWT', token, cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully ',
    token,
    data: {
      user,
    },
  });
});

// change the active field to false
exports.deleteLoggedUserData = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin')
    return next(new AppError('Admin cannot delete their account', 400));
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: 'Success' });
});
