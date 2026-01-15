function doGet(e) {
  // Open the active spreadsheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = e.parameter.sheet || 'Dashboard'; // Default to 'Dashboard' sheet
  var sheet = ss.getSheetByName(sheetName);
  
  var output = {};
  
  if (sheet) {
    // Get all data as text to preserve formatting
    var data = sheet.getDataRange().getDisplayValues();
    output[sheetName] = data;
  } else {
    // If specific sheet not found, return all sheets (fallback)
    var allSheets = ss.getSheets();
    allSheets.forEach(function(s) {
       output[s.getName()] = s.getDataRange().getDisplayValues();
    });
  }
  
  // Return JSON response
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  // Run this once to grant permissions if needed, though usually not required for Web App
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log(doc.getName());
}