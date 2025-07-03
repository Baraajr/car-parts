const multer = require('multer');
const sharp = require('sharp');
const Category = require('../models/categoryModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../utils/imageUpload');

exports.createFilterObject = (req, res, next) => {
  let filterObj;
  if (req.params.categoryId) filterObj = { product: req.params.categoryId };
  req.filterObj = filterObj;
  next();
};

const storage = multer.memoryStorage();
const upload = multer({ storage });
exports.uploadCategoryImage = upload.single('image');

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
    folder: 'categories',
    public_id: `category-${Date.now()}`,
    format: 'jpg',
  });

  req.body.image = result.secure_url; // Cloudinary URL

  console.log(`Image uploaded to Cloudinary, URL: ${result.secure_url}`);

  next();
});

//  route:  GET api/v1/categories
//  access  public
exports.getAllCategories = factory.getAll(Category, '', 'categories');

//  route:  POST api/v1/categories
//  access  admin
exports.createCategory = factory.createOne(Category);

//  route:  PATCH api/v1/categories/id
//  access  admin
exports.updateCategory = factory.updateOne(Category);

//  route:  GET api/v1/categories/id
//  access  public
exports.getCategory = factory.getOne(Category, 'subCategories');

//  route:  DELETE api/v1/categories/id
//  access  admin
exports.deleteCategory = factory.deleteOne(Category);
