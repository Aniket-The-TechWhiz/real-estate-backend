// Validation middleware for property data
exports.validatePropertyCreate = (req, res, next) => {
  const { title, images, category, listingType, price, bedrooms, bathrooms, area, description, furnishing } = req.body;
  const errors = [];

  // Required fields validation
  if (!title || title.trim() === '') {
    errors.push('Title is required');
  }

  // Check for images from either uploaded files or body
  const hasImages = (req.files && req.files.length > 0) || (images && Array.isArray(images) && images.length > 0);
  if (!hasImages) {
    errors.push('At least one image is required');
  }

  if (!category) {
    errors.push('Category is required');
  }

  if (!listingType) {
    errors.push('Listing type is required');
  }

  if (!price || price <= 0) {
    errors.push('Valid price is required');
  }

  if (bedrooms === undefined || bedrooms < 0) {
    errors.push('Valid number of bedrooms is required');
  }

  if (bathrooms === undefined || bathrooms < 0) {
    errors.push('Valid number of bathrooms is required');
  }

  if (!area || area <= 0) {
    errors.push('Valid area is required');
  }

  if (!description || description.trim() === '') {
    errors.push('Description is required');
  }

  if (!furnishing) {
    errors.push('Furnishing type is required');
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

// Validation middleware for property update
exports.validatePropertyUpdate = (req, res, next) => {
  const { price, bedrooms, bathrooms, area } = req.body;
  const errors = [];

  // Validate only if fields are provided
  if (price !== undefined && price <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (bedrooms !== undefined && bedrooms < 0) {
    errors.push('Bedrooms cannot be negative');
  }

  if (bathrooms !== undefined && bathrooms < 0) {
    errors.push('Bathrooms cannot be negative');
  }

  if (area !== undefined && area <= 0) {
    errors.push('Area must be greater than 0');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

// Validate MongoDB ObjectId
exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  // Simple regex check for MongoDB ObjectId format
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid property ID format'
    });
  }

  next();
};
