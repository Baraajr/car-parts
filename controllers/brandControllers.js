const Brand = require('../models/brandModel');
const factory = require('./handlerFactory');

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
