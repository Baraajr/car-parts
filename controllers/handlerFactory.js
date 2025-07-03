const slugify = require('slugify');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAll = (model, populateOptions, modelName = '') =>
  catchAsync(async (req, res) => {
    // case: nested route api/v1/categories/categoryId/subcategories
    let filter = {};
    if (req.filterObj) filter = req.filterObj;

    modelName = modelName || model.modelName;
    const documentsCounts = await model.countDocuments();
    const features = new ApiFeatures(model.find(filter), req.query)
      .paginate(documentsCounts)
      .filter()
      .search(model.modelName)
      .limitFields()
      .sort();

    // Execute query
    const { mongooseQuery, paginationResult } = features;

    if (populateOptions)
      features.mongooseQuery = features.mongooseQuery.populate({
        path: populateOptions,
        select: 'name',
      });
    const documents = await mongooseQuery;

    res.status(200).json({
      status: 'success',
      results: documents.length,
      paginationResult,
      data: documents,
    });
  });

exports.createOne = (model) =>
  catchAsync(async (req, res, next) => {
    // case: nested route api/v1/categories/categoryId/subcategories
    if (req.params.categoryId) req.body.category = req.params.categoryId;

    //to prevent anyone signup as an admin
    delete req.body.role;

    if (req.body.name) req.body.slug = slugify(req.body.name);
    if (req.body.title) req.body.slug = slugify(req.body.title);

    const newDoc = await model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: newDoc,
    });
  });

exports.getOne = (model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = model.findById(req.params.id);

    if (populateOptions)
      query = query.populate({
        path: populateOptions,
      });

    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`No Document with this ID ${req.params.id}`, 404),
      );
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.deleteOne = (model) =>
  catchAsync(async (req, res, next) => {
    // i used deleteOne to use the post deleteOne middleware to calculate average ratings after deleting a review
    const deletedDoc = await model.findOneAndDelete({ _id: req.params.id });

    if (!deletedDoc)
      return next(
        new AppError(`No document with this ID ${req.params.id}`, 404),
      );

    res.status(204).json({
      status: 'deleted',
      data: null,
    });
  });

exports.updateOne = (model) =>
  catchAsync(async (req, res, next) => {
    // case: updating title or name
    if (req.body.name) req.body.slug = slugify(req.body.name);
    if (req.body.title) req.body.slug = slugify(req.body.title);

    const oldDoc = await model.findById(req.params.id);
    if (!oldDoc) {
      return next(
        new AppError(`No document with this ID ${req.params.id}`, 404),
      );
    }

    oldDoc.set(req.body);
    // to be able to use the post save middleware
    const updatedDoc = await oldDoc.save();

    res.status(200).json({
      status: 'success',
      data: updatedDoc,
    });
  });
