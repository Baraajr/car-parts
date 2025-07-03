const express = require('express');
const { protect } = require('../controllers/authControllers');
const { getPresignedURL } = require('../controllers/uploadImageController');

const router = express.Router();

// GET api/v1/upload?type=user
router.get('/', protect, getPresignedURL);

module.exports = router;
