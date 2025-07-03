const mongoose = require('mongoose');
const slugify = require('slugify');
const { check, body, param } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Category = require('../../models/categoryModel');
const SubCategory = require('../../models/subCategoryModel');
const Product = require('../../models/productModel');
const Brand = require('../../models/brandModel');
const AppError = require('../appError');

exports.createProductValidator = [
  check('name')
    .isLength({ min: 3 })
    .withMessage('must be at least 3 chars')
    .notEmpty()
    .withMessage('Product name is required'),
  check('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 2000 })
    .withMessage('Too long description'),
  check('quantity')
    .notEmpty()
    .withMessage('Product quantity is required')
    .isNumeric()
    .withMessage('Product quantity must be a number')
    .custom((val) => {
      if (val < 0) {
        throw new AppError(
          'Product quantity must be greater than or equal to 0',
          400,
        );
      }
      if (val % 1 !== 0) {
        throw new AppError('Product quantity must be an integer', 400);
      }
      return true;
    }),
  check('sold')
    .optional()
    .isNumeric()
    .withMessage('Product quantity must be a number'),
  check('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isNumeric()
    .withMessage('Product price must be a number')
    .isLength({ max: 32 })
    .withMessage('To long price')
    .custom((val) => {
      if (val < 0) {
        throw new AppError(
          'Product price must be greater than or equal to 0',
          400,
        );
      }
      return true;
    }),
  check('priceAfterDiscount')
    .optional()
    .isNumeric()
    .withMessage('Product priceAfterDiscount must be a number')
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new AppError('priceAfterDiscount must be lower than price', 400);
      }
      return true;
    }),
  check('colors')
    .optional()
    .isArray()
    .withMessage('availableColors should be array of string'),
  check('imageCover').notEmpty().withMessage('Product imageCover is required'),
  check('images')
    .optional()
    .isArray()
    .withMessage('images should be array of string'),
  check('category')
    .notEmpty()
    .withMessage('Product must belong to a category')
    .isMongoId()
    .withMessage('Invalid category ID format')
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new AppError(`No category for this id: ${categoryId}`, 400),
          );
        }
      }),
    ),
  check('subcategories')
    .optional()
    .isArray()
    .withMessage('Subcategories must be an array')
    .custom((subcategoriesIds) => {
      // Check that each element in the array is a valid MongoDB ObjectID
      const areValidIds = subcategoriesIds.every((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );
      if (!areValidIds) {
        throw new AppError('One or more subcategory IDs are invalid.', 400);
      }

      // Perform the existence check in the database
      return SubCategory.find({ _id: { $in: subcategoriesIds } }).then(
        (result) => {
          if (result.length !== subcategoriesIds.length) {
            return Promise.reject(
              new AppError('One or more subcategory IDs do not exist.', 400),
            );
          }
          return true;
        },
      );
    })
    .custom((val, { req }) =>
      SubCategory.find({ category: req.body.category }).then(
        (subcategories) => {
          const subCategoriesIdsInDB = [];
          subcategories.forEach((subCategory) => {
            subCategoriesIdsInDB.push(subCategory._id.toString());
          });
          // check if subcategories ids in db include subcategories in req.body (true)
          const checker = (target, arr) => target.every((v) => arr.includes(v));
          if (!checker(val, subCategoriesIdsInDB)) {
            return Promise.reject(
              new AppError(`subcategories don't belong to this category`, 400),
            );
          }
        },
      ),
    ),
  check('brand')
    .optional()
    .isMongoId()
    .withMessage('Invalid brand ID format')
    .custom(async (brandId) => {
      const brand = await Brand.findById(brandId);
      if (!brand) {
        throw new AppError(`No brand with this id ${brandId}`, 400);
      }
    }),
  check('ratingsAverage')
    .optional()
    .isNumeric()
    .withMessage('ratingsAverage must be a number')
    .isLength({ min: 1 })
    .withMessage('Rating must be above or equal 1.0')
    .isLength({ max: 5 })
    .withMessage('Rating must be below or equal 5.0'),
  check('ratingsQuantity')
    .optional()
    .isNumeric()
    .withMessage('ratingsQuantity must be a number'),
  validatorMiddleware,
];

exports.getProductValidator = [
  check('id').isMongoId().withMessage('Invalid product ID format'),
  validatorMiddleware,
];

exports.updateProductValidator = [
  check('id').isMongoId().withMessage('Invalid product ID format'),
  body('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format')
    .custom(async (val, { req }) => {
      const categoryId = req.body.category;
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new AppError('No category for this id', 400);
      }
    }),
  validatorMiddleware,
];

exports.deleteProductValidator = [
  check('id').isMongoId().withMessage('Invalid product ID format'),
  validatorMiddleware,
];

// Middleware to validate productId
exports.validateProductId = [
  param('productId')
    .isMongoId() // Check if productId is a valid MongoDB ObjectId
    .withMessage('Invalid product ID format')
    .custom(async (val) => {
      // Check if the product exists in the database
      const product = await Product.findById(val);
      if (!product) {
        throw new AppError(`No product with this id ${val}`, 404);
      }
    }),
  validatorMiddleware,
];
