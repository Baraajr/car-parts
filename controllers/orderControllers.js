const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const factory = require('./handlerFactory');
const User = require('../models/userModel');

exports.createCashOrder = catchAsync(async (req, res, next) => {
  const taxPrice = 0;
  const shippingPrice = 0;
  //1)get the cart using cartId
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) return next(new AppError('There is no cart with this id', 404));

  //2)get total price from cart first check if coupon applied
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  //3)create order with cash method
  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    totalOrderPrice,
    shippingAddress: req.body.shippingAddress,
  });

  if (order) {
    const bulkOptions = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: item.quantity } },
      },
    }));

    await Product.bulkWrite(bulkOptions);
    //5)clear cart
    await Cart.findByIdAndDelete(req.params.cartId);
  }
  res.status(200).json({
    status: 'success',
    data: order,
  });
});

exports.filterOrdersForLoggedUser = catchAsync(async (req, res, next) => {
  if (req.user.role === 'user')
    req.filterObj = {
      user: req.user._id,
    };
  next();
});

exports.getAllOrders = factory.getAll(Order, '', 'orders');

exports.getOrder = factory.getOne(Order);

exports.updateOrderPaidStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) return next(new AppError('There is no order with this id', 404));

  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({
    status: 'success',
    data: updatedOrder,
  });
});

exports.updateOrderDeliveredStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) return next(new AppError('There is no order with this id', 404));

  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({
    status: 'success',
    data: updatedOrder,
  });
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const taxPrice = 0;
  const shippingPrice = 0;
  const cart = await Cart.findById(req.params.cartId);

  if (!cart) {
    return next(new AppError('No cart found with that ID', 404));
  }

  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;

  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'egp',
          product_data: {
            name: `Order for ${req.user.name}`,
          },
          unit_amount: Math.round(totalOrderPrice * 100), // Stripe expects amount in the smallest currency unit
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: process.env.SUCCESS_URL,
    cancel_url: process.env.CANCEL_URL,
    customer_email: req.user.email,
    client_reference_id: cart.id,
    metadata: req.body.shippingAddress || {}, // Ensure metadata is set correctly, even if shippingAddress is undefined
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

const createOrder = async (session, req, res) => {
  try {
    const cartId = session.client_reference_id;
    const shippingAddress = session.metadata || {}; // Use an empty object if no shipping address provided
    const orderPrice = session.amount_total / 100;

    const cart = await Cart.findById(cartId);
    const user = await User.findOne({ email: session.customer_email });

    if (!cart || !user) {
      return res.status(400).send('Cart or user not found');
    }

    const order = await Order.create({
      user: user._id,
      cartItems: cart.cartItems,
      totalOrderPrice: orderPrice,
      shippingAddress,
      isPaid: true,
      paidAt: Date.now(),
      paymentMethodType: 'card',
    });

    // Update product quantity and sold fields
    if (order) {
      const bulkOptions = cart.cartItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { quantity: -item.quantity, sold: item.quantity } },
        },
      }));

      await Product.bulkWrite(bulkOptions);

      // Clear the cart
      await Cart.findByIdAndDelete(cartId);
    }
  } catch (error) {
    return res.status(400).send(error); // Handle this properly in the calling function
  }
};

//will work only if the app is deployed
exports.webhookCheckout = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).json({ 'Webhook Error': err.message, event });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    await createOrder(event.data.object, req, res);
    return res.status(200).json({ message: 'Order created successfully' });
  }

  res.status(200).send('Webhook received');
});
