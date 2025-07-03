const express = require('express');
const productControllers = require('../controllers/productControllers');
const authControllers = require('../controllers/authControllers');
const reviewRouter = require('./reviewRoutes');

const {
  getProductValidator,
  createProductValidator,
  deleteProductValidator,
  updateProductValidator,
  validateProductId,
} = require('../utils/validators/productValidator');

const router = express.Router();

// POST  /products/productId/reviews  ==> to create a review on specific product
router.use('/:productId/reviews', validateProductId, reviewRouter);

router.get('/search', productControllers.search);

/////////////////////////////      MAIN CRUDS ROUTES      /////////////////////////////

router
  .route('/')
  .get(productControllers.getAllProducts)
  .post(
    authControllers.protect,
    authControllers.restrictTo('admin', 'manager'),
    productControllers.setBodySlug,
    createProductValidator,
    productControllers.createProduct,
  );

router
  .route('/:id')
  .get(getProductValidator, productControllers.getProduct)
  .patch(
    authControllers.protect,
    authControllers.restrictTo('admin', 'manager'),
    updateProductValidator,
    productControllers.updateProduct,
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo('admin'),
    deleteProductValidator,
    productControllers.deleteProduct,
  );

module.exports = router;
