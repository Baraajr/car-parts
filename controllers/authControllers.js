const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util'); // to make any function a promise
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail');

const getCookieOptions = (expireDate) => ({
  expires: expireDate,
  httpOnly: true,
  sameSite: 'none',
  secure: true, // Secure flag for production
});

const createJWTToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const createAndSendToken = (user, status, req, res) => {
  // 1) create the token
  const token = createJWTToken(user._id);

  const cookieOptions = getCookieOptions(
    new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
  );

  //2) save the token to the cookies
  res.cookie('JWT', token, cookieOptions);

  //3) send the token in the response
  res.status(status).json({
    status: 'success',
    token,
    user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  // 1)check the name is given
  // 2)check the email is unique (not used by any user)
  // 3)check the password equals the passwordConfirm
  // we will validate in the authValidator

  //4) create the user
  const user = await User.create({
    name,
    email,
    password,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  user.verificationToken = token;
  await user.save();

  const url = `${process.env.FRONT_URL}/verify-email?token=${token}`;
  const textMessage = ` Verify your email, Click here to verify: ${url}`;
  const htmlMessage = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
      <h2 style="color: #333;">Hi ${user.name},</h2>
      <p style="font-size: 16px; color: #555;">
        Please verify your email address by clicking the button below:
      </p>
      <a href="${url}" 
         style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p style="font-size: 14px; color: #555;">
        Or copy and paste this link into your browser:
      </p>
      <p style="font-size: 14px; color: #007bff;">${url}</p>
      <p style="font-size: 12px; color: #999;">
        This link is valid for 1 day.
      </p>
    </div>
  </div>
`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Code (Valid for 10 min)',
    text: textMessage, // Plain text version
    html: htmlMessage, // HTML version
  });

  res.status(201).json({
    status: 'success',
    message: 'User created. Please check your email to verify.',
  });
});

exports.resendVerificationEmail = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (user.verified)
    return res.status(400).json({ message: 'User already verified.' });

  // generate new token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  user.verificationToken = token;
  await user.save();

  const verificationUrl = `${process.env.FRONT_URL}/verify-email?token=${token}`;
  const textMessage = ` Verify your email, Click here to verify: ${verificationUrl}`;
  const htmlMessage = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
      <h2 style="color: #333;">Hi ${user.name},</h2>
      <p style="font-size: 16px; color: #555;">
        Please verify your email address by clicking the button below:
      </p>
      <a href="${verificationUrl}" 
         style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p style="font-size: 14px; color: #555;">
        Or copy and paste this link into your browser:
      </p>
      <p style="font-size: 14px; color: #007bff;">${verificationUrl}</p>
      <p style="font-size: 12px; color: #999;">
        This link is valid for 1 day.
      </p>
    </div>
  </div>
`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Code (Valid for 10 min)',
      text: textMessage, // Plain text version
      html: htmlMessage, // HTML version
    });
    res.status(200).json({ message: 'Verification email sent.' });
  } catch (err) {
    console.error('Error sending email:', err);
    res
      .status(500)
      .json({ message: 'Failed to send email. Please try again later.' });
  }
});
exports.verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) return res.status(400).send('Invalid token');

    if (user.verified) return res.status(200).send('Already verified');

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res
      .status(200)
      .json({ status: 'success', message: 'Email verified successfully' });
  } catch (err) {
    res
      .status(400)
      .json({ status: 'success', message: 'Invalid or expired token' });
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // we will check the request body in the validation layer

  //1) Find user by email or username
  const user = await User.findOne({ email }).select('+password');

  if (!user.verified)
    return next(new AppError('Please Verify your email first'));

  console.log(user);
  if (user.active === false) {
    return next(
      new AppError('This account has been deactivated. Contact support.', 403),
    );
  }
  //2) Check if user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) If everything is okay, send the token to the client and set the cookies
  createAndSendToken(user, 200, req, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  // 1) Clear the cookie by setting its expiration to a date in the past
  res.cookie('JWT', '', getCookieOptions(new Date(Date.now() - 1000)));

  //2) send the result
  res
    .status(200)
    .json({ status: 'success', message: 'Logged out successfully' });
});

// to check if the user logged in by checking the user token
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  //1) Check for token in Authorization header or cookies
  if (req.cookies.JWT) {
    token = req.cookies.JWT;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(token);
  //2) if there is no token
  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401),
    );
  }

  //2) Decode and verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Fetch the user based on the ID from the token
  const user = await User.findById(decoded.id);

  //4) check if the user deleted after the token was created
  if (!user) {
    return next(
      new AppError('User associated with this token no longer exists.', 401),
    );
  }

  //5) Check if the user changed password after the token was issued
  if (await user.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('user changed password recently !please log in again', 401),
    );

  //6) save the user data to the request object
  req.user = user;
  next();
});

// only some roles of users can access these routes
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array ['admin']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403),
      ); // forbidden
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new AppError('Please enter your email', 400));

  //1) get the user by his email
  const user = await User.findOne({ email });

  if (!user) return next(new AppError('Incorrect email', 400));

  // create the reset code
  const resetCode = user.createPasswordResetCode();
  await user.save({ validateBeforeSave: false });

  const textMessage = `Hi ${user.name},\nWe received a request to reset the password on your Car-Parts Account.\nUse this code to verify it's you: ${resetCode}\nThis code is valid for 10 minutes.`;
  const htmlMessage = `
      <p>Hi ${user.name},</p>
      <p>We received a request to reset the password on your Car-Parts Account.</p>
      <p>Use this code to verify it's you:</p>
      <h3>${resetCode}</h3>
      <p>This code is valid for 10 minutes.</p>
    `;

  //3) send the reset code in the email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Code (Valid for 10 min)',
      text: textMessage, // Plain text version
      html: htmlMessage, // HTML version
    });
  } catch (error) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();

    return next(new AppError('there was an error sending the email', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Reset code sent to your email!',
  });
});

exports.verifyPasswordResetCode = catchAsync(async (req, res, next) => {
  // Check if the reset code is provided
  if (!req.body.resetCode) {
    return next(new AppError('Please enter the reset code', 400));
  }

  if (!req.body.email) {
    return next(new AppError('Please enter your email', 400));
  }

  //1) Hash the provided reset code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

  //2) Find the user with the hashed reset code and check expiration
  const user = await User.findOne({
    email: req.body.email,
    active: true,
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If the user is not found, return an error
  if (!user) {
    return next(new AppError('Reset code invalid or expired', 400));
  }

  //3) Mark the reset code as verified
  user.passwordResetVerified = true;
  await user.save();

  // Respond with success
  res.status(200).json({
    status: 'success',
    message: 'Password reset code verified successfully',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email) return next(new AppError('Please enter your email ', 400));

  if (!newPassword || !confirmPassword) {
    return next(
      new AppError('Please enter and confirm your new password', 400),
    );
  }

  //1) get the user by his email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(
      new AppError(`there is no user with this email ${req.body.email}`, 400),
    );

  //2) check if he verified the identity by the code
  if (!user.passwordResetVerified)
    return next(new AppError('Please verify your reset code first ', 400));

  if (newPassword !== confirmPassword)
    return next(new AppError(" Password don't match ", 400));

  //4) remove the reset code relative field
  user.password = newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  await user.save();

  // 5) sign the user in
  const token = createJWTToken(user._id);
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
    message: 'Password has been reset successfully',
    token,
  });
});

exports.passportHandler = catchAsync(async (req, res) => {
  // Issue a JWT for the authenticated user
  const { user } = req;
  const id = user._id.toString();
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  // Store the JWT in an HTTP-only cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure === true || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('JWT', token, cookieOptions);

  // Redirect or send a response
  res.redirect('/');
});
