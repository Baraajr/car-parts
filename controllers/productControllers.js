const slugify = require('slugify');
const Product = require('../models/productModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

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
