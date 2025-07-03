const Category = require('../models/categoryModel');
const factory = require('./handlerFactory');

exports.createFilterObject = (req, res, next) => {
  let filterObj;
  if (req.params.categoryId) filterObj = { product: req.params.categoryId };
  req.filterObj = filterObj;
  next();
};

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
