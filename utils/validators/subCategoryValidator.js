const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const AppError = require('../appError');
const Category = require('../../models/categoryModel');

// check works for params and body
// this is a validator middleware to validate the params.id in order to catch error before it is sent to the database
exports.getSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid subCategory id'),
  validatorMiddleware,
];

exports.createSubCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('subCategory name required')
    .isLength({ min: 2 })
    .withMessage('Too short subCategory name')
    .isLength({ max: 32 })
    .withMessage('Too long subCategory name'),
  check('category')
    .notEmpty()
    .withMessage('subCategory must belong to category')
    .isMongoId()
    .withMessage('invalid category id')
    .custom(async (val, { req }) => {
      const category = await Category.findById(val);
      if (!category) {
        return Promise.reject(
          new AppError(`no category with this id ${val}`, 400),
        );
      }
    }),
  validatorMiddleware,
];

exports.updateSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid subCategory id'),
  validatorMiddleware,
];

exports.deleteSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid subCategory id'),
  validatorMiddleware,
];
