function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Leads");
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet("Leads");
      // Add headers
      sheet.appendRow([
        "Timestamp", 
        "Full Name", 
        "Contact Number", 
        "Property Type", 
        "Location", 
        "Property Title", 
        "Property ID", 
        "Status"
      ]);
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4285F4");
      headerRange.setFontColor("#FFFFFF");
    }
    
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Create timestamp
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MM/dd/yyyy, hh:mm:ss a");
    
    // Prepare row data
    const row = [
      timestamp,
      data.fullName || '',
      data.contactNumber || '',
      data.propertyType || '',
      data.location || '',
      data.propertyTitle || 'N/A',
      data.propertyId || 'N/A',
      data.status || 'new'
    ];
    
    // Append the row
    sheet.appendRow(row);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 8);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "Lead submitted successfully",
        data: {
          fullName: data.fullName,
          contactNumber: data.contactNumber,
          propertyType: data.propertyType,
          location: data.location,
          timestamp: timestamp
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET request to fetch all leads
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Leads");
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          count: 0,
          data: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert to JSON array
    const leads = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.toLowerCase().replace(/ /g, '')] = row[index];
      });
      return obj;
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        count: leads.length,
        data: leads
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}