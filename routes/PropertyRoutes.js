const express = require('express');
const router = express.Router();
const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  searchProperties
} = require('../controller/PropertyController');
const {
  validatePropertyCreate,
  validatePropertyUpdate,
  validateObjectId
} = require('../middleware/validateProperty');
const { uploadPropertyImages, handleMulterError } = require('../middleware/uploadImages');

// Property routes
router.post('/', uploadPropertyImages, handleMulterError, validatePropertyCreate, createProperty);
router.get('/', getAllProperties);
router.get('/search', searchProperties);
router.get('/:id', validateObjectId, getPropertyById);
router.put('/:id', uploadPropertyImages, handleMulterError, validateObjectId, validatePropertyUpdate, updateProperty);
router.delete('/:id', validateObjectId, deleteProperty);

module.exports = router;
