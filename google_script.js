/**
 * google_script.js - Google Apps Script Backend for 90-Day Buddhist Lent Abstinence Project
 * 
 * Instructions:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1cvuqthcaa91Cc7LIvcwE68M6HKzvzALDRQX07fEs-cY/edit?gid=0#gid=0
 * 2. Go to Extensions (ส่วนขยาย) > Apps Script
 * 3. Delete any code in the editor and paste this code.
 * 4. Click the Save icon (floppy disk).
 * 5. Click "Deploy" (การทำให้ใช้งานได้) > "New deployment" (การทำให้ใช้งานได้ใหม่)
 * 6. Select Type: "Web app" (เว็บแอป)
 * 7. Set:
 *    - Description: Lent Abstinence API
 *    - Execute as (เรียกใช้งานในฐานะ): "Me" (ฉัน - บัญชีอีเมลของคุณ)
 *    - Who has access (ผู้มีสิทธิ์เข้าถึง): "Anyone" (ทุกคน) *** ห้ามเลือกเป็นอย่างอื่น
 * 8. Click "Deploy". Grant permissions if requested (กด Review Permissions แล้วเลือกบัญชีเพื่ออนุญาต).
 * 9. Copy the "Web app URL" (ที่ลงท้ายด้วย /exec) และนำมาใส่ในการตั้งค่าระบบของหน้าเว็บเพื่อเชื่อมต่อ
 */

const SPREADSHEET_ID = "1cvuqthcaa91Cc7LIvcwE68M6HKzvzALDRQX07fEs-cY";

// Helper function to get Spreadsheet
function getSS() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {}
  if (!ss) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return ss;
}

// Parse employee database from Name sheet (preserves leading zero)
function getEmployeeMasterData(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  
  // Find column indices
  var colEmpId = headers.indexOf("รหัสพนักงาน");
  var colFullName = headers.indexOf("ชื่อ-นามสกุล");
  var colFirstName = headers.indexOf("ชื่อ");
  var colLastName = headers.indexOf("นามสกุล");
  var colDept = headers.indexOf("แผนก");
  
  // Fallbacks for headers
  if (colEmpId === -1) colEmpId = headers.indexOf("EmployeeID");
  if (colFullName === -1) colFullName = headers.indexOf("ชื่อ นามสกุล") !== -1 ? headers.indexOf("ชื่อ นามสกุล") : headers.indexOf("Name");
  if (colFirstName === -1) colFirstName = headers.indexOf("FirstName");
  if (colLastName === -1) colLastName = headers.indexOf("LastName");
  if (colDept === -1) colDept = headers.indexOf("Department");
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var empId = colEmpId !== -1 ? row[colEmpId].toString().replace(/^'/, '').trim() : "";
    if (!empId) continue;
    
    // Auto-pad leading zero to 4 digits if numeric and length < 4 for display consistency (optional, but keep original value)
    if (/^\d+$/.test(empId) && empId.length < 4) {
      empId = empId.padStart(4, '0');
    }
    
    var firstName = "";
    var lastName = "";
    
    if (colFullName !== -1) {
      var fullName = row[colFullName].toString().trim();
      var nameParts = fullName.split(/\s+/);
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    } else {
      firstName = colFirstName !== -1 ? row[colFirstName].toString().trim() : "";
      lastName = colLastName !== -1 ? row[colLastName].toString().trim() : "";
    }
    
    var dept = colDept !== -1 ? row[colDept].toString().trim() : "";
    
    result.push({
      EmployeeID: empId,
      FirstName: firstName,
      LastName: lastName,
      Department: dept
    });
  }
  return result;
}

// Initialize Spreadsheet Sheets and Column Structures
function initSheets() {
  var ss = getSS();
  if (!ss) return "Error: Spreadsheet not found!";
  
  // 1. "Name" Sheet (Employee Database)
  var nameSheet = ss.getSheetByName("Name");
  if (!nameSheet) {
    nameSheet = ss.insertSheet("Name");
    nameSheet.appendRow(["รหัสพนักงาน", "ชื่อ", "นามสกุล", "แผนก"]);
    // Sample employee database (leading zeros preserved by prepending ')
    nameSheet.appendRow(["'0001", "สมชาย", "รักดี", "ฝ่ายผลิต"]);
    nameSheet.appendRow(["'0002", "สมหญิง", "เรียนดี", "ฝ่ายขาย"]);
    nameSheet.appendRow(["'0003", "กิตติ", "มุ่งมั่น", "ไอที"]);
    nameSheet.appendRow(["'0004", "นภา", "สว่างไสว", "บัญชี"]);
    nameSheet.appendRow(["'0005", "วิรุฬห์", "ก้าวหน้า", "คลังสินค้า"]);
    nameSheet.appendRow(["'0006", "รสริน", "สิริกุล", "การตลาด"]);
    nameSheet.appendRow(["'0007", "ประวิทย์", "ทุ่มเท", "ทรัพยากรบุคคล"]);
    nameSheet.appendRow(["'0008", "ศรัญญู", "เลิศล้ำ", "ฝ่ายผลิต"]);
  }
  
  // 2. "Registrations" Sheet
  var regSheet = ss.getSheetByName("Registrations");
  if (!regSheet) {
    regSheet = ss.insertSheet("Registrations");
    regSheet.appendRow(["Timestamp", "EmployeeID", "FirstName", "LastName", "Department", "Phone", "Shift", "Goal", "Target", "Duration"]);
  }
  
  // 3. "Surveys" Sheet
  var surveySheet = ss.getSheetByName("Surveys");
  if (!surveySheet) {
    surveySheet = ss.insertSheet("Surveys");
    surveySheet.appendRow(["Timestamp", "EmployeeID", "FirstName", "LastName", "Department", "Achieved", "Reason"]);
  }
  
  // 4. "Winners" Sheet
  var winnerSheet = ss.getSheetByName("Winners");
  if (!winnerSheet) {
    winnerSheet = ss.insertSheet("Winners");
    winnerSheet.appendRow(["Timestamp", "WinnerNo", "EmployeeID", "FirstName", "LastName", "Department", "Goal", "Target", "Reward"]);
  }
  
  return "Initialization Complete!";
}

// Convert sheet records to JSON Object array
function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      }
      if (headers[j] === "EmployeeID" || headers[j] === "รหัสพนักงาน") {
        val = val.toString().replace(/^'/, ''); // strip leading apostrophe
      }
      obj[headers[j]] = val;
    }
    result.push(obj);
  }
  return result;
}

// Format response as JSON
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle GET Requests
function doGet(e) {
  var ss = getSS();
  // Lazy initialize sheets if missing
  if (ss && (!ss.getSheetByName("Name") || !ss.getSheetByName("Registrations") || !ss.getSheetByName("Surveys") || !ss.getSheetByName("Winners"))) {
    initSheets();
  }
  
  var action = e.parameter.action;
  var callback = e.parameter.prefix || e.parameter.callback;
  var responseData;
  
  try {
    if (action === "getAllData") {
      responseData = {
        success: true,
        data: {
          employees: getEmployeeMasterData(ss.getSheetByName("Name")),
          registrations: getSheetDataAsObjects(ss.getSheetByName("Registrations")),
          surveys: getSheetDataAsObjects(ss.getSheetByName("Surveys")),
          winners: getSheetDataAsObjects(ss.getSheetByName("Winners"))
        }
      };
    } else if (action === "registerJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleRegister(ss, payload);
    } else if (action === "submitSurveyJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleSurveySubmit(ss, payload);
    } else if (action === "saveWinnerJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleSaveWinner(ss, payload);
    } else if (action === "clearWinnersJSONP") {
      responseData = handleClearWinners(ss);
    } else {
      responseData = { success: false, error: "Invalid GET Action" };
    }
  } catch (err) {
    responseData = { success: false, error: err.toString() };
  }
  
  if (callback) {
    var output = callback + "(" + JSON.stringify(responseData) + ")";
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return jsonResponse(responseData);
  }
}

// Handle POST Requests
function doPost(e) {
  var ss = getSS();
  if (ss && (!ss.getSheetByName("Name") || !ss.getSheetByName("Registrations") || !ss.getSheetByName("Surveys") || !ss.getSheetByName("Winners"))) {
    initSheets();
  }
  
  var postData;
  try {
    postData = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, error: "Invalid JSON format" });
  }
  
  var action = postData.action;
  var responseData = { success: false, error: "Invalid POST Action" };
  
  if (action === "register") {
    responseData = handleRegister(ss, postData);
  } else if (action === "submitSurvey") {
    responseData = handleSurveySubmit(ss, postData);
  } else if (action === "saveWinner") {
    responseData = handleSaveWinner(ss, postData);
  } else if (action === "clearWinners") {
    responseData = handleClearWinners(ss);
  }
  
  return jsonResponse(responseData);
}

// 1. Handle Registration
function handleRegister(ss, postData) {
  var sheet = ss.getSheetByName("Registrations");
  var empId = postData.employeeId.toString().trim();
  
  // Format with leading quote to preserve leading zero
  var formattedEmpId = "'" + empId;
  
  // Check for duplicate registration
  var registrations = getSheetDataAsObjects(sheet);
  for (var i = 0; i < registrations.length; i++) {
    if (registrations[i].EmployeeID === empId) {
      return { success: false, error: "รหัสพนักงานนี้ได้ลงทะเบียนเข้าร่วมโครงการเรียบร้อยแล้วค่ะ" };
    }
  }
  
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  sheet.appendRow([
    timestamp,
    formattedEmpId,
    postData.firstName,
    postData.lastName,
    postData.department,
    postData.phone,
    postData.shift,
    postData.goal,
    postData.target,
    postData.duration
  ]);
  
  return { success: true, message: "ลงทะเบียนเข้าร่วมโครงการสำเร็จแล้ว ขอบคุณที่ร่วมเป็นส่วนหนึ่งของการเปลี่ยนแปลงสุขภาพที่ดีขึ้นค่ะ!" };
}

// 2. Handle Survey Submission
function handleSurveySubmit(ss, postData) {
  var sheet = ss.getSheetByName("Surveys");
  var empId = postData.employeeId.toString().trim();
  
  // Check if they already submitted a survey
  var surveys = getSheetDataAsObjects(sheet);
  for (var i = 0; i < surveys.length; i++) {
    if (surveys[i].EmployeeID === empId) {
      return { success: false, error: "รหัสพนักงานนี้เคยทำแบบประเมินผลสำเร็จไปแล้วในระบบค่ะ" };
    }
  }
  
  // Verify that the employee is actually registered
  var regSheet = ss.getSheetByName("Registrations");
  var regs = getSheetDataAsObjects(regSheet);
  var registeredUser = null;
  for (var j = 0; j < regs.length; j++) {
    if (regs[j].EmployeeID === empId) {
      registeredUser = regs[j];
      break;
    }
  }
  
  if (!registeredUser) {
    return { success: false, error: "ไม่พบข้อมูลการลงทะเบียนสำหรับรหัสพนักงานนี้ในระบบ กรุณาลงทะเบียนเข้าร่วมโครงการก่อนทำแบบสอบถามค่ะ" };
  }
  
  var formattedEmpId = "'" + empId;
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  sheet.appendRow([
    timestamp,
    formattedEmpId,
    registeredUser.FirstName,
    registeredUser.LastName,
    registeredUser.Department,
    postData.achieved, // "ทำได้" or "ทำไม่ได้"
    postData.reason || "" // Reason if Achieved = "ทำไม่ได้"
  ]);
  
  return { success: true, message: "บันทึกแบบประเมินเรียบร้อยแล้ว ขอบคุณที่ให้ข้อมูลและยินดีกับผลลัพธ์ของเป้าหมายท่านค่ะ!" };
}

// 3. Handle Saving a Winner
function handleSaveWinner(ss, postData) {
  var sheet = ss.getSheetByName("Winners");
  var empId = postData.employeeId.toString().trim();
  var formattedEmpId = "'" + empId;
  
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  sheet.appendRow([
    timestamp,
    postData.winnerNo, // e.g., "รางวัลที่ 1", "รางวัลที่ 2"
    formattedEmpId,
    postData.firstName,
    postData.lastName,
    postData.department,
    postData.goal,
    postData.target,
    postData.reward || ""
  ]);
  
  return { success: true, message: "บันทึกรายชื่อผู้ได้รับรางวัล เรียบร้อยแล้วค่ะ" };
}

// 4. Handle Clearing Winners (in case of retry/resetting the game)
function handleClearWinners(ss) {
  var sheet = ss.getSheetByName("Winners");
  if (!sheet) return { success: false, error: "Winners sheet not found" };
  
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  return { success: true, message: "รีเซ็ตรายชื่อผู้ได้รับรางวัลเพื่อเริ่มจับสลากใหม่สำเร็จแล้ว" };
}

// Add Custom Admin Menu directly in Google Sheets
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🕉️ ระบบลด ละ เลิก 90 วัน")
    .addItem("🔄 สร้างแท็บตารางทั้งหมดหากยังไม่มี", "initSheets")
    .addToUi();
}
