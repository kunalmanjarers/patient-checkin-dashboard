/**
 * Google Apps Script - Patient Check-in API
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Google Sheets > Extensions > Apps Script
 * 2. Delete any existing code and paste this entire file
 * 3. Update SPREADSHEET_ID with your Google Sheet ID
 * 4. Click Deploy > New Deployment > Web App
 * 5. Set "Execute as" to "Me" and "Who has access" to "Anyone"
 * 6. Copy the Web App URL for use in the frontend
 */

// ============================================
// CONFIGURATION - UPDATE THIS!
// ============================================
const SPREADSHEET_ID = '19T7DZ8XoA_P4P6ePpGWnifgMekEEoTfOaTMXD5ML8cc';

// Column positions (1-indexed)
const STATUS_COLUMN = 16;          // Column P
const PATIENT_ID_COLUMN = 17;      // Column Q
const COUNSELOR_COLUMN = 18;       // Column R
const NOTES_COLUMN = 19;           // Column S

// Counselors list
const COUNSELORS = [
  "Dr. Sarah Johnson",
  "Dr. Michael Chen",
  "Dr. Emily Rodriguez",
  "Dr. James Wilson",
  "Dr. Lisa Thompson",
  "Dr. Robert Garcia",
  "Maria Santos, LCSW",
  "John Davis, LPC",
  "Amanda White, LMFT"
];

// Simple users database (in production, use a more secure method)
const USERS = {
  'admin': { password: 'admin123', name: 'Administrator', role: 'admin' },
  'frontdesk': { password: 'desk123', name: 'Front Desk', role: 'staff' },
  'therapist': { password: 'therapy123', name: 'Therapist', role: 'therapist' }
};

// ============================================
// MAIN ENTRY POINTS
// ============================================

/**
 * Handle GET requests
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Main request handler
 */
function handleRequest(e) {
  // Enable CORS
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const params = e.parameter;
    const action = params.action || 'unknown';
    
    let result;
    
    switch(action) {
      case 'login':
        result = handleLogin(params.username, params.password);
        break;
      case 'getTodaysCheckins':
        result = getTodaysCheckins();
        break;
      case 'getAllPatients':
        result = getAllPatients();
        break;
      case 'getPatientHistory':
        result = getPatientHistory(params.patientId);
        break;
      case 'updateStatus':
        result = updateStatus(parseInt(params.row), params.status);
        break;
      case 'assignCounselor':
        result = assignCounselor(parseInt(params.row), params.counselor);
        break;
      case 'saveNotes':
        result = saveNotes(parseInt(params.row), params.notes);
        break;
      case 'searchPatients':
        result = searchPatients(params.term);
        break;
      case 'getAnalytics':
        result = getAnalytics(parseInt(params.days) || 30);
        break;
      case 'getCounselors':
        result = { success: true, counselors: COUNSELORS };
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    output.setContent(JSON.stringify(result));
    
  } catch (error) {
    output.setContent(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    }));
  }
  
  return output;
}

// ============================================
// AUTHENTICATION
// ============================================

function handleLogin(username, password) {
  if (!username || !password) {
    return { success: false, error: 'Username and password required' };
  }
  
  const user = USERS[username.toLowerCase()];
  
  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  return {
    success: true,
    user: {
      username: username,
      name: user.name,
      role: user.role
    }
  };
}

// ============================================
// DATA FUNCTIONS
// ============================================

function getSheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
}

function getHeaders() {
  const sheet = getSheet();
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function getAllData() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const record = { _row: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = data[i][j];
    }
    records.push(record);
  }
  
  return records;
}

function getTodaysCheckins() {
  const data = getAllData();
  
  // Get today's date components
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();
  
  Logger.log('Today: ' + todayYear + '-' + (todayMonth + 1) + '-' + todayDate);
  
  const todaysRecords = data.filter(record => {
    const timestamp = record['Timestamp'];
    if (!timestamp) return false;
    
    try {
      // Handle both ISO format and regular date format
      let recordDate;
      
      if (typeof timestamp === 'string') {
        // Try parsing as ISO string (2025-12-31T16:03:43.472Z)
        if (timestamp.includes('T')) {
          recordDate = new Date(timestamp);
        } 
        // Try parsing as US format (12/31/2025 10:30:00)
        else if (timestamp.includes('/')) {
          recordDate = new Date(timestamp);
        }
        else {
          recordDate = new Date(timestamp);
        }
      } else if (timestamp instanceof Date) {
        recordDate = timestamp;
      } else {
        // Try to create date from value
        recordDate = new Date(timestamp);
      }
      
      if (isNaN(recordDate.getTime())) {
        Logger.log('Invalid date: ' + timestamp);
        return false;
      }
      
      // Compare year, month, and date
      const matches = recordDate.getFullYear() === todayYear &&
                      recordDate.getMonth() === todayMonth &&
                      recordDate.getDate() === todayDate;
      
      if (matches) {
        Logger.log('Match found: ' + timestamp);
      }
      
      return matches;
      
    } catch (e) {
      Logger.log('Date parse error for: ' + timestamp + ' - ' + e.message);
      return false;
    }
  });
  
  Logger.log('Found ' + todaysRecords.length + ' records for today');
  
  // Calculate wait times
  const nowTime = new Date();
  todaysRecords.forEach(record => {
    const status = record['Status'] || '';
    
    if (['Completed', 'Cancelled', 'No Show'].includes(status)) {
      record.WaitMinutes = 0;
      record.WaitDisplay = 'Done';
    } else {
      try {
        const checkinTime = new Date(record['Timestamp']);
        const waitMs = nowTime - checkinTime;
        record.WaitMinutes = Math.floor(waitMs / 60000);
        record.WaitDisplay = record.WaitMinutes + ' min';
      } catch (e) {
        record.WaitMinutes = 0;
        record.WaitDisplay = 'N/A';
      }
    }
  });
  
  // Sort by timestamp descending
  todaysRecords.sort((a, b) => {
    return new Date(b['Timestamp']) - new Date(a['Timestamp']);
  });
  
  return { success: true, patients: todaysRecords, count: todaysRecords.length };
}

function getAllPatients() {
  const data = getAllData();
  
  // Get unique patients by Patient ID, keeping the most recent record
  const patientMap = {};
  data.forEach(record => {
    const patientId = record['Patient ID'];
    if (patientId) {
      if (!patientMap[patientId] || new Date(record['Timestamp']) > new Date(patientMap[patientId]['Timestamp'])) {
        patientMap[patientId] = record;
      }
    }
  });
  
  const patients = Object.values(patientMap);
  patients.sort((a, b) => new Date(b['Timestamp']) - new Date(a['Timestamp']));
  
  return { success: true, patients: patients, count: patients.length };
}

function getPatientHistory(patientId) {
  if (!patientId) {
    return { success: false, error: 'Patient ID required' };
  }
  
  const data = getAllData();
  const history = data.filter(record => record['Patient ID'] === patientId);
  
  history.sort((a, b) => new Date(b['Timestamp']) - new Date(a['Timestamp']));
  
  // Get patient info from most recent record
  const patientInfo = history.length > 0 ? history[0] : null;
  
  // Calculate stats
  const stats = {
    totalVisits: history.length,
    completed: history.filter(r => r['Status'] === 'Completed').length,
    cancelled: history.filter(r => r['Status'] === 'Cancelled').length,
    noShow: history.filter(r => r['Status'] === 'No Show').length
  };
  stats.successRate = stats.totalVisits > 0 ? Math.round((stats.completed / stats.totalVisits) * 100) : 0;
  
  return { 
    success: true, 
    patientInfo: patientInfo,
    history: history, 
    stats: stats 
  };
}

function searchPatients(term) {
  if (!term || term.length < 2) {
    return { success: false, error: 'Search term must be at least 2 characters' };
  }
  
  const data = getAllData();
  const termLower = term.toLowerCase();
  
  const matches = data.filter(record => {
    return (
      (record['Patient ID'] || '').toString().toLowerCase().includes(termLower) ||
      (record['First Name'] || '').toString().toLowerCase().includes(termLower) ||
      (record['Last Name'] || '').toString().toLowerCase().includes(termLower) ||
      (record['Date of Birth'] || '').toString().includes(term) ||
      (record['Phone Number'] || '').toString().includes(term)
    );
  });
  
  // Get unique patients
  const patientMap = {};
  matches.forEach(record => {
    const patientId = record['Patient ID'];
    if (patientId && !patientMap[patientId]) {
      patientMap[patientId] = record;
    }
  });
  
  return { success: true, patients: Object.values(patientMap), count: Object.values(patientMap).length };
}

// ============================================
// UPDATE FUNCTIONS
// ============================================

function updateStatus(row, status) {
  if (!row || !status) {
    return { success: false, error: 'Row and status required' };
  }
  
  try {
    const sheet = getSheet();
    sheet.getRange(row, STATUS_COLUMN).setValue(status);
    return { success: true, message: 'Status updated to ' + status };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function assignCounselor(row, counselor) {
  if (!row || !counselor) {
    return { success: false, error: 'Row and counselor required' };
  }
  
  try {
    const sheet = getSheet();
    sheet.getRange(row, COUNSELOR_COLUMN).setValue(counselor);
    return { success: true, message: 'Assigned to ' + counselor };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function saveNotes(row, notes) {
  if (!row) {
    return { success: false, error: 'Row required' };
  }
  
  try {
    const sheet = getSheet();
    sheet.getRange(row, NOTES_COLUMN).setValue(notes || '');
    return { success: true, message: 'Notes saved' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ============================================
// ANALYTICS
// ============================================

function getAnalytics(days) {
  const data = getAllData();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const filteredData = data.filter(record => {
    try {
      const recordDate = new Date(record['Timestamp']);
      return recordDate >= cutoffDate;
    } catch (e) {
      return false;
    }
  });
  
  // Calculate metrics
  const totalVisits = filteredData.length;
  const uniquePatients = [...new Set(filteredData.map(r => r['Patient ID']))].length;
  const completed = filteredData.filter(r => r['Status'] === 'Completed').length;
  const cancelled = filteredData.filter(r => r['Status'] === 'Cancelled').length;
  const completionRate = totalVisits > 0 ? Math.round((completed / totalVisits) * 100) : 0;
  
  // Status breakdown
  const statusCounts = {};
  filteredData.forEach(r => {
    const status = r['Status'] || 'Waiting';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Insurance breakdown
  const insuranceCounts = { 'Yes': 0, 'No': 0 };
  filteredData.forEach(r => {
    const hasInsurance = r['Do you have insurance?'];
    if (hasInsurance === 'Yes' || hasInsurance === 'No') {
      insuranceCounts[hasInsurance]++;
    }
  });
  
  // Counselor breakdown
  const counselorCounts = {};
  filteredData.forEach(r => {
    const counselor = r['Assigned Counselor'];
    if (counselor) {
      counselorCounts[counselor] = (counselorCounts[counselor] || 0) + 1;
    }
  });
  
  // Day of week breakdown
  const dayOfWeekCounts = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  filteredData.forEach(r => {
    try {
      const date = new Date(r['Timestamp']);
      const day = dayNames[date.getDay()];
      dayOfWeekCounts[day]++;
    } catch (e) {}
  });
  
  // Hourly breakdown
  const hourlyCounts = {};
  for (let i = 6; i <= 20; i++) {
    hourlyCounts[i] = 0;
  }
  filteredData.forEach(r => {
    try {
      const date = new Date(r['Timestamp']);
      const hour = date.getHours();
      if (hourlyCounts.hasOwnProperty(hour)) {
        hourlyCounts[hour]++;
      }
    } catch (e) {}
  });
  
  // Pregnancy status
  const pregnancyCounts = {};
  filteredData.forEach(r => {
    const status = r['Are you currently pregnant?'] || r['Are you pregnant?'] || 'Unknown';
    pregnancyCounts[status] = (pregnancyCounts[status] || 0) + 1;
  });
  
  // Residential program
  const residentialCounts = { 'Yes': 0, 'No': 0 };
  filteredData.forEach(r => {
    const residential = r['Are you in a Residential Program?'];
    if (residential === 'Yes' || residential === 'No') {
      residentialCounts[residential]++;
    }
  });
  
  return {
    success: true,
    metrics: {
      totalVisits,
      uniquePatients,
      completed,
      cancelled,
      completionRate
    },
    charts: {
      status: statusCounts,
      insurance: insuranceCounts,
      counselor: counselorCounts,
      dayOfWeek: dayOfWeekCounts,
      hourly: hourlyCounts,
      pregnancy: pregnancyCounts,
      residential: residentialCounts
    }
  };
}

// ============================================
// FORM SUBMISSION HANDLER (Keep existing)
// ============================================

/**
 * Test function to debug date issues - Run this from Apps Script editor
 */
function testDateParsing() {
  const data = getAllData();
  
  Logger.log('=== DATE PARSING TEST ===');
  Logger.log('Total records: ' + data.length);
  Logger.log('Script timezone: ' + Session.getScriptTimeZone());
  
  const now = new Date();
  Logger.log('Current time: ' + now.toString());
  Logger.log('Today: ' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate());
  
  // Check first 5 records
  data.slice(0, 5).forEach((record, i) => {
    const ts = record['Timestamp'];
    Logger.log('--- Record ' + i + ' ---');
    Logger.log('Raw timestamp: ' + ts);
    Logger.log('Type: ' + typeof ts);
    
    if (ts) {
      try {
        const parsed = new Date(ts);
        Logger.log('Parsed: ' + parsed.toString());
        Logger.log('Year: ' + parsed.getFullYear() + ', Month: ' + parsed.getMonth() + ', Date: ' + parsed.getDate());
        Logger.log('Is valid: ' + !isNaN(parsed.getTime()));
      } catch (e) {
        Logger.log('Parse error: ' + e.message);
      }
    }
  });
  
  // Test getTodaysCheckins
  const result = getTodaysCheckins();
  Logger.log('=== getTodaysCheckins Result ===');
  Logger.log('Count: ' + result.count);
  Logger.log('Patients: ' + JSON.stringify(result.patients.map(p => p['First Name'] + ' ' + p['Last Name'])));
}

function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var statusCol = findColumnByHeader(headers, "Status");
  var patientIdCol = findColumnByHeader(headers, "Patient ID");
  
  if (statusCol === -1 || patientIdCol === -1) {
    Logger.log("ERROR: Could not find Status or Patient ID columns.");
    return;
  }
  
  sheet.getRange(lastRow, statusCol).setValue("Waiting");
  
  var patientId = generatePatientId(sheet, lastRow, headers);
  sheet.getRange(lastRow, patientIdCol).setValue(patientId);
}

function findColumnByHeader(headers, headerName) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().trim().toLowerCase() === headerName.toLowerCase()) {
      return i + 1;
    }
  }
  return -1;
}

function generatePatientId(sheet, currentRow, headers) {
  var firstNameCol = findColumnByHeader(headers, "First Name");
  var lastNameCol = findColumnByHeader(headers, "Last Name");
  var dobCol = findColumnByHeader(headers, "Date of Birth");
  var patientIdCol = findColumnByHeader(headers, "Patient ID");
  
  var firstName = sheet.getRange(currentRow, firstNameCol).getValue().toString().trim();
  var lastName = sheet.getRange(currentRow, lastNameCol).getValue().toString().trim();
  var dobRaw = sheet.getRange(currentRow, dobCol).getValue();
  
  var dobFormatted = formatDOB(dobRaw);
  
  var initials = "";
  if (firstName) initials += firstName.charAt(0).toUpperCase();
  if (lastName) initials += lastName.charAt(0).toUpperCase();
  
  var existingId = findExistingPatient(sheet, firstName, lastName, dobRaw, currentRow, headers);
  if (existingId) return existingId;
  
  var baseId = initials + "-" + dobFormatted;
  var sequence = countSimilarIds(sheet, baseId, currentRow, patientIdCol);
  if (sequence > 0) return baseId + "-" + sequence;
  
  return baseId;
}

function formatDOB(dobValue) {
  if (!dobValue) return "00000000";
  
  if (dobValue instanceof Date) {
    var month = String(dobValue.getMonth() + 1).padStart(2, '0');
    var day = String(dobValue.getDate()).padStart(2, '0');
    var year = String(dobValue.getFullYear());
    return month + day + year;
  }
  
  var dobString = dobValue.toString();
  var dateObj = new Date(dobString);
  
  if (!isNaN(dateObj.getTime())) {
    var month = String(dateObj.getMonth() + 1).padStart(2, '0');
    var day = String(dateObj.getDate()).padStart(2, '0');
    var year = String(dateObj.getFullYear());
    return month + day + year;
  }
  
  return dobString.replace(/\D/g, '').substring(0, 8);
}

function findExistingPatient(sheet, firstName, lastName, dob, currentRow, headers) {
  var data = sheet.getDataRange().getValues();
  var firstNameIdx = findColumnByHeader(headers, "First Name") - 1;
  var lastNameIdx = findColumnByHeader(headers, "Last Name") - 1;
  var dobIdx = findColumnByHeader(headers, "Date of Birth") - 1;
  var patientIdIdx = findColumnByHeader(headers, "Patient ID") - 1;
  
  for (var i = 1; i < currentRow - 1; i++) {
    var rowFirstName = data[i][firstNameIdx].toString().trim().toLowerCase();
    var rowLastName = data[i][lastNameIdx].toString().trim().toLowerCase();
    var rowDob = data[i][dobIdx];
    var rowPatientId = data[i][patientIdIdx];
    
    if (rowFirstName === firstName.toLowerCase() && 
        rowLastName === lastName.toLowerCase() &&
        compareDates(rowDob, dob) &&
        rowPatientId) {
      return rowPatientId;
    }
  }
  return null;
}

function compareDates(date1, date2) {
  var d1 = new Date(date1);
  var d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return date1.toString() === date2.toString();
  }
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function countSimilarIds(sheet, baseId, currentRow, patientIdCol) {
  var data = sheet.getDataRange().getValues();
  var patientIdIdx = patientIdCol - 1;
  var count = 0;
  
  for (var i = 1; i < currentRow - 1; i++) {
    var existingId = data[i][patientIdIdx].toString();
    if (existingId.startsWith(baseId)) {
      count++;
    }
  }
  
  return count;
}
