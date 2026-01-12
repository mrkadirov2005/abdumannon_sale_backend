/**
 * Google Apps Script for Finance Management
 * Deploy this as a web app and use the URL in your React app
 */

const SHEET_ID = "YOUR_SPREADSHEET_ID"; // Replace with your spreadsheet ID
const SHEET_NAME = "Finance";

// Initialize the sheet on first run
function initializeSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ["person_name", "total_amount", "paid_amount", "remaining_amount", "payments", "wagons", "indicator", "created_at", "updated_at"];
    sheet.appendRow(headers);
  }
}

// Get all finance records
function getFinanceRecords() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { success: false, message: "Sheet not found" };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const records = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // Skip empty rows
        records.push({
          person_name: row[0],
          total_amount: parseFloat(row[1]) || 0,
          paid_amount: parseFloat(row[2]) || 0,
          remaining_amount: parseFloat(row[3]) || 0,
          payments: row[4] ? JSON.parse(row[4]) : [],
          wagons: row[5] ? JSON.parse(row[5]) : [],
          indicator: row[6],
          created_at: row[7],
          updated_at: row[8],
        });
      }
    }

    return { success: true, data: records };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Add or update finance record
function saveFinanceRecord(record) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      initializeSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Find existing record
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === record.person_name) {
        rowIndex = i + 1; // Sheets are 1-indexed
        break;
      }
    }

    const timestamp = new Date().toISOString();
    const newRow = [
      record.person_name,
      record.total_amount,
      record.paid_amount,
      record.remaining_amount,
      JSON.stringify(record.payments || []),
      JSON.stringify(record.wagons || []),
      record.indicator,
      record.created_at || timestamp,
      timestamp,
    ];

    if (rowIndex > 0) {
      // Update existing row
      const range = sheet.getRange(rowIndex, 1, 1, newRow.length);
      range.setValues([newRow]);
    } else {
      // Add new row
      sheet.appendRow(newRow);
    }

    return { success: true, message: "Record saved successfully" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Add payment to a person
function addPayment(personName, payment) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === personName) {
        const payments = data[i][4] ? JSON.parse(data[i][4]) : [];
        payments.push(payment);

        const paid_amount = parseFloat(data[i][2]) + payment.amount;
        const total_amount = parseFloat(data[i][1]);
        const remaining_amount = total_amount - paid_amount;

        const newRow = [
          data[i][0], // person_name
          total_amount,
          paid_amount,
          remaining_amount,
          JSON.stringify(payments),
          data[i][5], // wagons
          data[i][6], // indicator
          data[i][7], // created_at
          new Date().toISOString(), // updated_at
        ];

        const range = sheet.getRange(i + 1, 1, 1, newRow.length);
        range.setValues([newRow]);

        return { success: true, message: "Payment added successfully" };
      }
    }

    return { success: false, message: "Person not found" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Delete finance record
function deleteFinanceRecord(personName) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === personName) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Record deleted successfully" };
      }
    }

    return { success: false, message: "Person not found" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// Handle CORS preflight requests
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader("Access-Control-Allow-Origin", "*")
    .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Web app entry point
function doGet(e) {
  const action = e.parameter.action;

  try {
    if (action === "getRecords") {
      return ContentService.createTextOutput(JSON.stringify(getFinanceRecords()))
        .setMimeType(ContentService.MimeType.JSON)
        .addHeader("Access-Control-Allow-Origin", "*")
        .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Invalid action" }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader("Access-Control-Allow-Origin", "*")
      .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      .addHeader("Access-Control-Allow-Headers", "Content-Type");
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader("Access-Control-Allow-Origin", "*")
      .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      .addHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

// Web app entry point for POST requests
function doPost(e) {
  const action = e.parameter.action;
  const payload = JSON.parse(e.postData.contents);

  try {
    if (action === "saveRecord") {
      return ContentService.createTextOutput(JSON.stringify(saveFinanceRecord(payload)))
        .setMimeType(ContentService.MimeType.JSON)
        .addHeader("Access-Control-Allow-Origin", "*")
        .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type");
    } else if (action === "addPayment") {
      return ContentService.createTextOutput(JSON.stringify(addPayment(payload.personName, payload.payment)))
        .setMimeType(ContentService.MimeType.JSON)
        .addHeader("Access-Control-Allow-Origin", "*")
        .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type");
    } else if (action === "deleteRecord") {
      return ContentService.createTextOutput(JSON.stringify(deleteFinanceRecord(payload.personName)))
        .setMimeType(ContentService.MimeType.JSON)
        .addHeader("Access-Control-Allow-Origin", "*")
        .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Invalid action" }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader("Access-Control-Allow-Origin", "*")
      .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      .addHeader("Access-Control-Allow-Headers", "Content-Type");
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader("Access-Control-Allow-Origin", "*")
      .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      .addHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}
