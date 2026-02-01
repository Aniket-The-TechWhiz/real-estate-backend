const config = require('../config/config');
const fetch = require('node-fetch');

// Helper function to send data to Google Sheets via Apps Script
const sendToGoogleSheets = async (leadData) => {
  try {
    const response = await fetch(config.googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
      redirect: 'follow'
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending to Google Sheets:', error);
    throw error;
  }
};

// Submit a lead form
exports.submitLead = async (req, res) => {
  try {
    const { fullName, contactNumber, propertyType, location, propertyId, propertyTitle } = req.body;
    
    // Validate required fields
    if (!fullName || !contactNumber || !propertyType || !location) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (fullName, contactNumber, propertyType, location)'
      });
    }
    
    // Prepare data for Google Sheets
    const leadData = {
      fullName,
      contactNumber,
      propertyType,
      location,
      propertyId: propertyId || null,
      propertyTitle: propertyTitle || null,
      status: 'new'
    };
    
    // Send to Google Sheets
    const result = await sendToGoogleSheets(leadData);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Lead submitted successfully to Google Sheets',
        data: result.data
      });
    } else {
      throw new Error(result.message || 'Failed to submit to Google Sheets');
    }
  } catch (error) {
    console.error('Error submitting lead:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting lead'
    });
  }
};

// Get all leads
exports.getAllLeads = async (req, res) => {
  try {
    // Fetch from Google Sheets
    const response = await fetch(config.googleSheetsUrl);
    const result = await response.json();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        count: result.count || 0,
        data: result.data || []
      });
    } else {
      throw new Error(result.message || 'Failed to fetch leads');
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get lead by ID - Not supported with Google Sheets
exports.getLeadById = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'This feature is not available with Google Sheets integration. Use GET /api/leads to fetch all leads.'
  });
};

// Update lead status - Not supported with Google Sheets
exports.updateLeadStatus = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'This feature is not available with Google Sheets integration. Please update directly in Google Sheets.'
  });
};

// Download Excel file - Not needed with Google Sheets
exports.downloadLeadsExcel = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Data is stored in Google Sheets. Access your Google Sheet directly to view/download the data.'
  });
};

// Delete a lead - Not supported with Google Sheets
exports.deleteLead = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'This feature is not available with Google Sheets integration. Please delete directly in Google Sheets.'
  });
};
