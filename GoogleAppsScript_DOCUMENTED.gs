/**
 * GOOGLE APPS SCRIPT - FINANCE MODULE
 * 
 * HOW TO USE THIS:
 * 1. Create a Google Sheet at https://sheets.google.com
 * 2. Open your sheet, go to Extensions > Apps Script
 * 3. Copy ALL code from GoogleAppsScript.gs (in project root)
 * 4. Paste it into the Apps Script editor
 * 5. Find "YOUR_SPREADSHEET_ID" and replace with your actual ID
 *    - ID is in the URL: https://docs.google.com/spreadsheets/d/[ID]/edit
 * 6. Save the project as "Finance API"
 * 7. Click Deploy > New deployment
 * 8. Set it as a Web app with "Anyone" access
 * 9. Copy the deployment URL
 * 10. Paste the URL in src/config/googleSheetsConfig.ts
 */

// ⚠️ IMPORTANT: Replace this with your actual Spreadsheet ID
// Get it from: https://docs.google.com/spreadsheets/d/[COPY_THIS_ID]/edit
const SHEET_ID = "YOUR_SPREADSHEET_ID"; // 👈 REPLACE THIS!

const SHEET_NAME = "Finance";

// ============================================
// Initialize Sheet on First Run
// ============================================
function initializeSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "person_name",
      "total_amount",
      "paid_amount",
      "remaining_amount",
      "payments",
      "wagons",
      "indicator",
      "created_at",
      "updated_at"
    ];
    sheet.appendRow(headers);
    console.log("Sheet initialized successfully!");
  }
}

// ============================================
// GET: Retrieve all finance records
// ============================================
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

    // Skip header row (row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (row[0]) {
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

// ============================================
// POST: Save or Update a Finance Record
// ============================================
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

    // Find existing record by person_name
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
      return { success: true, message: "Record updated successfully" };
    } else {
      // Add new row
      sheet.appendRow(newRow);
      return { success: true, message: "Record saved successfully" };
    }
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ============================================
// POST: Add Payment to Person's Record
// ============================================
function addPayment(personName, payment) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    // Find person's record
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === personName) {
        // Parse existing payments or create empty array
        const payments = data[i][4] ? JSON.parse(data[i][4]) : [];
        payments.push(payment);

        // Calculate new amounts
        const paid_amount = parseFloat(data[i][2]) + payment.amount;
        const total_amount = parseFloat(data[i][1]);
        const remaining_amount = total_amount - paid_amount;

        // Prepare new row
        const newRow = [
          data[i][0], // person_name
          total_amount,
          paid_amount,
          remaining_amount,
          JSON.stringify(payments),
          data[i][5], // wagons (unchanged)
          data[i][6], // indicator (unchanged)
          data[i][7], // created_at (unchanged)
          new Date().toISOString(), // updated_at (new timestamp)
        ];

        // Update the row
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

// ============================================
// DELETE: Remove a Finance Record
// ============================================
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

// ============================================
// GET Request Handler
// ============================================
function doGet(e) {
  const action = e.parameter.action;

  try {
    if (action === "getRecords") {
      const result = getFinanceRecords();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Invalid action" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// POST Request Handler
// ============================================
function doPost(e) {
  const action = e.parameter.action;
  const payload = JSON.parse(e.postData.contents);

  try {
    if (action === "saveRecord") {
      return ContentService.createTextOutput(
        JSON.stringify(saveFinanceRecord(payload))
      ).setMimeType(ContentService.MimeType.JSON);
      
    } else if (action === "addPayment") {
      return ContentService.createTextOutput(
        JSON.stringify(addPayment(payload.personName, payload.payment))
      ).setMimeType(ContentService.MimeType.JSON);
      
    } else if (action === "deleteRecord") {
      return ContentService.createTextOutput(
        JSON.stringify(deleteFinanceRecord(payload.personName))
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Invalid action" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// Testing Function (Optional)
// Can be used to test from Apps Script editor
// ============================================
function testScript() {
  // Test 1: Initialize Sheet
  console.log("Test 1: Initialize Sheet");
  initializeSheet();
  
  // Test 2: Get Records
  console.log("Test 2: Get Records");
  const records = getFinanceRecords();
  console.log(records);
  
  // Test 3: Save a Record
  console.log("Test 3: Save Record");
  const testRecord = {
    person_name: "Test User",
    total_amount: 100000,
    paid_amount: 0,
    remaining_amount: 100000,
    payments: [],
    wagons: [],
    indicator: "debt_taken",
  };
  const saveResult = saveFinanceRecord(testRecord);
  console.log(saveResult);
  
  console.log("All tests completed!");
}
