const Property = require('../models/Property');
const sharp = require('sharp');

const parseImagesFromBody = (images) => {
  if (!images) return [];

  let list = images;
  if (typeof images === 'string') {
    try {
      list = JSON.parse(images);
    } catch (error) {
      list = [images];
    }
  }

  if (!Array.isArray(list)) {
    list = [list];
  }

  return list.map((item, index) => {
    if (typeof item !== 'string') return null;
    const match = item.match(/^data:(.+);base64,(.+)$/);
    if (!match) return null;
    return {
      data: Buffer.from(match[2], 'base64'),
      contentType: match[1],
      filename: `image-${Date.now()}-${index}`
    };
  }).filter(Boolean);
};

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase().trim();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
};

const parseFields = (fields) => {
  if (!fields) return null;
  return fields
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);
};

const buildImageUrl = (req, propertyId, index, options = {}) => {
  const { width, format } = options;
  const params = new URLSearchParams();
  if (width) params.set('w', String(width));
  if (format) params.set('format', format);
  const query = params.toString();
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/api/properties/${propertyId}/images/${index}${query ? `?${query}` : ''}`;
};

const formatPropertyResponse = (property, req, options = {}) => {
  const {
    includeImages = false,
    imageSize = 'original',
    thumbOnly = false,
    includeThumbnail = true
  } = options;

  const obj = property.toObject ? property.toObject({ virtuals: true }) : property;
  const images = Array.isArray(obj.images) ? obj.images : [];

  const thumbWidth = 500;
  const imageWidth = imageSize === 'thumb' ? thumbWidth : undefined;

  const response = { ...obj };
  delete response.images;

  if (includeThumbnail && images.length > 0) {
    response.thumbnailUrl = buildImageUrl(req, obj._id, 0, { width: thumbWidth, format: 'webp' });
  }

  if (includeImages && images.length > 0) {
    const targetWidth = thumbOnly ? thumbWidth : imageWidth;
    response.imageUrls = images.map((_, index) => buildImageUrl(req, obj._id, index, {
      width: targetWidth,
      format: 'webp'
    }));
  }

  return response;
};

// Create a new property
exports.createProperty = async (req, res) => {
  try {
    // Handle uploaded images from multer (memory)
    const images = req.files && req.files.length > 0
      ? req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype,
        filename: file.originalname
      }))
      : parseImagesFromBody(req.body.images);
    
    const propertyData = {
      title: req.body.title,
      images: images,
      category: req.body.category,
      listingType: req.body.listingType,
      price: req.body.price,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      area: req.body.area,
      description: req.body.description,
      amenities: req.body.amenities,
      furnishing: req.body.furnishing,
      location: req.body.location
    };

    const property = await Property.create(propertyData);
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: formatPropertyResponse(property, req, { includeImages: true })
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all properties with filters
exports.getAllProperties = async (req, res) => {
  try {
    const { 
      category,
      listingType, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      bathrooms, 
      furnishing,
      status,
      page = 1,
      limit = 10,
      includeImages,
      fields,
      imageSize,
      thumbOnly
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (listingType) filter.listingType = listingType;
    if (bedrooms) filter.bedrooms = Number(bedrooms);
    if (bathrooms) filter.bathrooms = Number(bathrooms);
    if (furnishing) filter.furnishing = furnishing;
    if (status) filter.status = status;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const shouldIncludeImages = parseBoolean(includeImages, false);
    const onlyThumbs = parseBoolean(thumbOnly, false) || imageSize === 'thumb';
    const fieldList = parseFields(fields);
    
    let query = Property.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    if (fieldList && fieldList.length > 0) {
      const selectFields = new Set(fieldList);
      selectFields.add('_id');
      selectFields.add('images');
      query = query.select(Array.from(selectFields).join(' '));
    }

    query = query.select('-images.data').slice('images', 1);

    const properties = await query;

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: properties.map((property) => formatPropertyResponse(property, req, {
        includeImages: shouldIncludeImages,
        imageSize: onlyThumbs ? 'thumb' : imageSize,
        thumbOnly: true,
        includeThumbnail: true
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single property by ID
exports.getPropertyById = async (req, res) => {
  try {
    const { includeImages, fields, imageSize, thumbOnly } = req.query;
    const shouldIncludeImages = parseBoolean(includeImages, false);
    const onlyThumbs = parseBoolean(thumbOnly, false) || imageSize === 'thumb';
    const fieldList = parseFields(fields);

    let query = Property.findById(req.params.id).lean();

    if (fieldList && fieldList.length > 0) {
      const selectFields = new Set(fieldList);
      selectFields.add('_id');
      selectFields.add('images');
      query = query.select(Array.from(selectFields).join(' '));
    }

    query = query.select('-images.data');

    const property = await query;

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatPropertyResponse(property, req, {
        includeImages: shouldIncludeImages,
        imageSize: imageSize || 'original',
        thumbOnly: onlyThumbs,
        includeThumbnail: true
      })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  try {
    // Handle uploaded images if any
    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype,
        filename: file.originalname
      }));
    } else if (req.body.images) {
      const parsed = parseImagesFromBody(req.body.images);
      if (parsed.length > 0) {
        updateData.images = parsed;
      }
    }
    
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: formatPropertyResponse(property, req, { includeImages: true })
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete property
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search properties
exports.searchProperties = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const properties = await Property.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    })
      .select('-images.data')
      .slice('images', 1)
      .lean()
      .limit(20);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties.map((property) => formatPropertyResponse(property, req, {
        includeImages: false,
        imageSize: 'thumb',
        thumbOnly: true,
        includeThumbnail: true
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get property image by index with optional resizing/format
exports.getPropertyImage = async (req, res) => {
  try {
    const { id, index } = req.params;
    const { format, w } = req.query;

    const property = await Property.findById(id).select('images').lean();

    if (!property || !Array.isArray(property.images) || property.images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const imageIndex = Number(index);
    if (Number.isNaN(imageIndex) || imageIndex < 0 || imageIndex >= property.images.length) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const image = property.images[imageIndex];
    if (!image || !image.data) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const width = w ? Number(w) : undefined;
    const targetFormat = format ? String(format).toLowerCase() : null;

    let transformer = sharp(image.data);

    if (width && !Number.isNaN(width)) {
      transformer = transformer.resize({ width, withoutEnlargement: true });
    }

    let contentType = image.contentType || 'image/jpeg';

    if (targetFormat === 'webp') {
      transformer = transformer.webp({ quality: 80 });
      contentType = 'image/webp';
    } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
      transformer = transformer.jpeg({ quality: 85 });
      contentType = 'image/jpeg';
    } else if (targetFormat === 'png') {
      transformer = transformer.png();
      contentType = 'image/png';
    }

    const output = await transformer.toBuffer();

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Vary', 'Accept');

    return res.status(200).send(output);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
