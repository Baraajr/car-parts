const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const SubCategory = require('../models/subCategoryModel');

dotenv.config();

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  await mongoose.connection.close();
  await mongod.stop();
});

global.createAdminUser = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'test1234',
    role: 'admin',
  });

  return admin;
};

global.createReqularUser = async (options) => {
  if (options) {
    const user = await User.create({
      name: options.name,
      email: options.email,
      password: options.password,
      passwordConfirm: options.passwordConfirm,
    });
    return user;
  }
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'test1234',
  });

  return user;
};

global.createJWTToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

global.createCategory = async () => {
  const category = await Category.create({
    name: 'Test Category',
  });
  return category;
};

global.createSubCategory = async (categoryId) => {
  const subCategory = await SubCategory.create({
    name: 'test subCategory',
    category: categoryId,
  });
  return subCategory;
};

global.createBrand = async () => {
  const brand = await Brand.create({
    name: 'test brand',
  });
  return brand;
};

// eslint-disable-next-line no-shadow
global.createProduct = async (categoryId) => {
  const product = await Product.create({
    name: 'Test Product',
    price: 100,
    description: 'Test product description',
    category: categoryId,
    color: 'Test Color',
    quantity: 10,
    imageCover: 'test-cover.jpg',
  });

  return product;
};

global.deleteAllProducts = async () => {
  await Product.deleteMany({});
};

global.deleteAllCategories = async () => {
  await Category.deleteMany({});
};

global.deleteAllBrands = async () => {
  await Brand.deleteMany({});
};

global.deleteAllSubCategories = async () => {
  await SubCategory.deleteMany({});
};

global.deleteAllUsers = async () => {
  await User.deleteMany({});
};
