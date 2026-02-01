const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  images: [{
    data: {
      type: Buffer,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    }
  }],
  category: {
    type: String,
    required: [true, 'Property category is required'],
    enum: ['Apartment', 'House', 'Villa', 'Studio', 'Penthouse', 'Condo', 'Townhouse', 'Other'],
    default: 'Apartment'
  },
  listingType: {
    type: String,
    required: [true, 'Listing type is required'],
    enum: ['Rent', 'Sale'],
    default: 'Rent'
  },
  price: {
    type: Number,
    required: [true, 'Property price is required'],
    min: [0, 'Price cannot be negative']
  },
  bedrooms: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Bedrooms cannot be negative']
  },
  bathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Bathrooms cannot be negative']
  },
  area: {
    type: Number,
    required: [true, 'Property area is required'],
    min: [0, 'Area cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  amenities: [{
    type: String,
    trim: true
  }],
  furnishing: {
    type: String,
    required: [true, 'Furnishing type is required'],
    enum: ['Furnished', 'Semi-Furnished', 'Unfurnished', 'Fully Furnished'],
    default: 'Unfurnished'
  },
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Available', 'Rented', 'Sold'],
    default: 'Available'
  }
}, {
  timestamps: true
});

// Index for faster queries
propertySchema.index({ price: 1, bedrooms: 1, category: 1 });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
