
const express = require('express');
const router = express.Router();

const { uploadImage } = require('../middleware/upload');       
const uploadController = require('../controllers/uploadController'); 


router.post('/image', uploadImage, uploadController.uploadImage);

module.exports = router;
