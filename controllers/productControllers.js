const multer = require('multer');
const slugify = require('slugify');
const sharp = require('sharp');
const Product = require('../models/productModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../utils/imageUpload');

const multerStorage = multer.memoryStorage();

const upload = multer({ storage: multerStorage });

exports.uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

exports.resizeImages = catchAsync(async (req, res, next) => {
  if (!req.files) return next();

  const uploadFolder = `products`;
  const timestamp = Date.now();

  const uploadedData = {
    imageCover: null,
    images: [],
  };

  // 1. Upload imageCover
  if (req.files.imageCover && req.files.imageCover[0]) {
    const buffer = await sharp(req.files.imageCover[0].buffer)
      .resize(1200, 800)
      .jpeg({ quality: 90 })
      .toBuffer();

    const base64 = `data:${req.files.imageCover[0].mimetype};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: uploadFolder,
      public_id: `product-${timestamp}-cover`,
      format: 'jpg',
    });

    uploadedData.imageCover = result.secure_url;
  }

  // 2. Upload other images[]
  if (req.files.images) {
    uploadedData.images = await Promise.all(
      req.files.images.map(async (file, i) => {
        const buffer = await sharp(file.buffer)
          .resize(1000, 1000)
          .jpeg({ quality: 85 })
          .toBuffer();

        const base64 = `data:${file.mimetype};base64,${buffer.toString('base64')}`;

        const result = await cloudinary.uploader.upload(base64, {
          folder: uploadFolder,
          public_id: `product-${timestamp}-img-${i}`,
          format: 'jpg',
        });

        return result.secure_url;
      }),
    );
  }

  // attach result to req.body to save in DB later
  req.body.imageCover = uploadedData.imageCover;
  req.body.images = uploadedData.images;

  next();
});

exports.setBodySlug = (req, res, next) => {
  if (req.body.name) req.body.slug = slugify(req.body.name);
  next();
};

exports.getAllProducts = factory.getAll(Product, '', 'products');
exports.createProduct = factory.createOne(Product);
exports.getProduct = factory.getOne(Product, 'reviews');
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);

exports.search = catchAsync(async (req, res, next) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Search text is required' });
  }

  // Build the query object
  const query = {
    $or: [
      { title: { $regex: text, $options: 'i' } },
      { description: { $regex: text, $options: 'i' } },
    ],
  };

  // Perform the search
  const products = await Product.find(query);

  res.json({ products });
});
