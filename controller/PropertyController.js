const Property = require('../models/Property');

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

const formatPropertyImages = (property) => {
  const obj = property.toObject({ virtuals: true });
  if (Array.isArray(obj.images)) {
    obj.images = obj.images.map((img) => {
      if (img && img.data && img.contentType) {
        const base64 = img.data.toString('base64');
        return `data:${img.contentType};base64,${base64}`;
      }
      return img;
    });
  }
  return obj;
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
      data: formatPropertyImages(property)
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
      limit = 10 
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
    
    const properties = await Property.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: properties.map(formatPropertyImages)
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
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatPropertyImages(property)
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
      data: formatPropertyImages(property)
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
    }).limit(20);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties.map(formatPropertyImages)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
