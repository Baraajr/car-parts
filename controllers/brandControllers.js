const multer = require('multer');
const sharp = require('sharp');
const Brand = require('../models/brandModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../utils/imageUpload');

const storage = multer.memoryStorage();
const upload = multer({ storage });
exports.uploadBrandImage = upload.single('image');

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const buffer = await sharp(req.file.buffer)
    .resize(1200, 800)
    .jpeg({ quality: 90 })
    .toBuffer();

  // Convert the buffer to a base64 string
  const base64Image = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;

  // Upload the base64 image directly to Cloudinary
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'brands',
    public_id: `brand-${Date.now()}`,
    format: 'jpg',
  });

  req.body.image = result.secure_url; // Cloudinary URL

  console.log(`Image uploaded to Cloudinary, URL: ${result.secure_url}`);

  next();
});

//  route:  GET api/v1/brands
//  access  public
exports.getAllBrands = factory.getAll(Brand, '', 'brands');

//  route:  POST api/v1/brands
//  access  admin
exports.createBrand = factory.createOne(Brand);

//  route:  PATCH api/v1/brands/id
//  access  admin
exports.updateBrand = factory.updateOne(Brand);

//  route:  GET api/v1/brands/id  id = mongo id
//  access  public
exports.getBrand = factory.getOne(Brand);

//  route:  DELETE api/v1/brands/id
//  access  admin
exports.deleteBrand = factory.deleteOne(Brand);
