/**
 * Abdumannon shop - Google Sheets backup endpoint (Apps Script web app).
 *
 * The shop backend POSTs { key, data: { table: rows[] } } here (daily + "Backup to Google Sheets" button)
 * and GETs ?key=... for "Restore from Sheets". Every table is written to its own tab.
 *
 * Setup (in the spreadsheet that should hold the backup):
 *   1. Extensions > Apps Script, replace everything with this file, save.
 *   2. Project Settings (gear) > Script properties > Add property:
 *        BACKUP_KEY = <the "key" value from ~/.shop-sheets-backup.json on the server>
 *   3. Deploy > New deployment > type "Web app"
 *        Execute as: Me    Who has access: Anyone
 *      Authorize when asked, then copy the Web app URL (ends with /exec).
 *   4. Put that URL into "appsScriptUrl" in ~/.shop-sheets-backup.json on the server.
 *
 * Requests without the right key are rejected, so the public URL alone exposes nothing.
 */

var META_SHEET = "_backup_meta";
var MAX_CELL_CHARS = 50000; // Google Sheets limit per cell

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return json_({ success: false, message: "Another backup is still running" });
  }

  try {
    var body = JSON.parse(e.postData.contents);
    if (!keyIsValid_(body.key)) {
      return json_({ success: false, message: "Invalid backup key" });
    }

    var data = body.data || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tables = Object.keys(data);
    var totalRows = 0;

    tables.forEach(function (table) {
      var records = Array.isArray(data[table]) ? data[table] : [];
      var sheet = ss.getSheetByName(table) || ss.insertSheet(table);
      sheet.clear();
      if (records.length === 0) return;

      var headers = columnsOf_(records);
      var values = [headers].concat(
        records.map(function (record) {
          return headers.map(function (h) { return toCell_(record[h], table, h); });
        })
      );

      var range = sheet.getRange(1, 1, values.length, headers.length);
      // Store everything as plain text so Sheets does not reformat ids, phone numbers or dates
      range.setNumberFormat("@");
      range.setValues(values);
      sheet.setFrozenRows(1);
      totalRows += records.length;
    });

    var meta = ss.getSheetByName(META_SHEET) || ss.insertSheet(META_SHEET);
    meta.clear();
    meta.getRange(1, 1, 4, 2).setValues([
      ["last_backup_at", new Date().toISOString()],
      ["tables", tables.length],
      ["rows", totalRows],
      ["source_created_at", (body.meta && body.meta.created_at) || ""],
    ]);

    return json_({ success: true, tables: tables.length, rows: totalRows });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    if (!keyIsValid_(e.parameter.key)) {
      return json_({ success: false, message: "Invalid backup key" });
    }

    var data = {};
    SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(function (sheet) {
      var name = sheet.getName();
      if (name === META_SHEET) return;

      var values = sheet.getDataRange().getValues();
      if (values.length < 2 || values[0][0] === "") {
        data[name] = [];
        return;
      }

      var headers = values[0];
      data[name] = values.slice(1).map(function (row) {
        var record = {};
        headers.forEach(function (h, i) {
          // Empty cells were nulls in the database
          record[h] = row[i] === "" ? null : row[i];
        });
        return record;
      });
    });

    return json_({ success: true, data: data });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function keyIsValid_(key) {
  var expected = PropertiesService.getScriptProperties().getProperty("BACKUP_KEY");
  return Boolean(expected) && key === expected;
}

function columnsOf_(records) {
  var seen = {};
  var columns = [];
  records.forEach(function (record) {
    Object.keys(record).forEach(function (k) {
      if (!seen[k]) {
        seen[k] = true;
        columns.push(k);
      }
    });
  });
  return columns;
}

function toCell_(value, table, column) {
  if (value === null || value === undefined) return "";
  var text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (text.length > MAX_CELL_CHARS) {
    throw new Error(table + "." + column + " has a value longer than " + MAX_CELL_CHARS + " characters");
  }
  // A leading apostrophe stops Sheets treating text like "=..." as a formula; getValues() drops it again
  return /^[=+]/.test(text) ? "'" + text : text;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
