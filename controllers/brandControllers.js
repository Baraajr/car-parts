const multer = require('multer');
const Brand = require('../models/brandModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../utils/imageUpload');
const Category = require('../models/categoryModel');
const AppError = require('../utils/appError');

const storage = multer.memoryStorage();
const upload = multer({ storage });
exports.uploadBrandImage = upload.single('image');

exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Convert the buffer to a base64 string
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

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

exports.addCategoryId = catchAsync(async (req, res, next) => {
  const { categoryId } = req.body;
  const { brandId } = req.params;

  const category = await Category.findById(categoryId);

  if (!category) return next(new AppError('No category for this id', 400));

  const updatedBrand = await Brand.findByIdAndUpdate(
    brandId,
    { $addToSet: { categoryTypes: categoryId } }, // prevents duplicates
    { new: true },
  );
  res.status(200).json(updatedBrand);
});
exports.getBrandsByCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  console.log(categoryId);
  const category = await Category.findById(categoryId);

  if (!category) return next(new AppError('No category for this id', 400));

  const brands = await Brand.find({
    categoryTypes: {
      $in: categoryId,
    },
  });
  res.status(200).json(brands);
});
