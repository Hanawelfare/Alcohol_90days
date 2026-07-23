/**
 * app.js - Client-side Logic for 90-Day Buddhist Lent Abstinence Project
 */

// Check if URL requests clearing LocalStorage
if (window.location.search.includes("clear=true")) {
  localStorage.clear();
  window.location.href = window.location.pathname; // Redirect to clean URL
}

// Global Application State
const STATE = {
  apiSettings: {
    apiUrl: "https://script.google.com/macros/s/AKfycbyplPD1dWl9dO2yyKwHvbHjXmO9X_fJ0tgNgMzHBQzo8mThPjIMcvcofSyi5UEMBwwa4A/exec", // Deployed Google Sheets Web App URL
    isMockMode: false // Defaults to Online Mode directly
  },
  project: {
    adminPassword: "ad2026",
    systemDate: "2026-07-14", // Local system date matching workspace time
    targetCompletionDate: "2026-08-26" // 3-month completion date (Buddhist Lent End)
  },
  config: {
    SurveyOpen: "false" // Central lock controlled by Google Sheets Config sheet
  },
  employees: [], // Master database
  registrations: [], // Registered participants
  surveys: [], // Survey submissions
  winners: [], // Drawn winners (maximum 5)
  charts: {}, // Active Chart.js instances
  adminAuthenticated: false,
  isSpinning: false,
  eligibleForDraw: [] // Eligible participants for Lucky Wheel
};

// Default Mock Employee List (used when Name sheet is empty or offline)
const DEFAULT_EMPLOYEE_DB = [
  { EmployeeID: "0001", FirstName: "สมชาย", LastName: "รักดี", Department: "ฝ่ายผลิต" },
  { EmployeeID: "0002", FirstName: "สมหญิง", LastName: "เรียนดี", Department: "ฝ่ายขาย" },
  { EmployeeID: "0003", FirstName: "กิตติ", LastName: "มุ่งมั่น", Department: "ไอที" },
  { EmployeeID: "0004", FirstName: "นภา", LastName: "สว่างไสว", Department: "บัญชี" },
  { EmployeeID: "0005", FirstName: "วิรุฬห์", LastName: "ก้าวหน้า", Department: "คลังสินค้า" },
  { EmployeeID: "0006", FirstName: "รสริน", LastName: "สิริกุล", Department: "การตลาด" },
  { EmployeeID: "0007", FirstName: "ประวิทย์", LastName: "ทุ่มเท", Department: "ทรัพยากรบุคคล" },
  { EmployeeID: "0008", FirstName: "ศรัญญู", LastName: "เลิศล้ำ", Department: "ฝ่ายผลิต" },
  { EmployeeID: "0026", FirstName: "สุพรรษา", LastName: "มะลิ", Department: "ฝ่ายบุคคล" },
  { EmployeeID: "0105", FirstName: "เกรียงไกร", LastName: "ชาญศิลป์", Department: "ขนส่ง" }
];

// Default Mock Registrations (to make dashboard look alive in Mock Mode)
const DEFAULT_MOCK_REGISTRATIONS = [
  { EmployeeID: "0001", FirstName: "สมชาย", LastName: "รักดี", Department: "ฝ่ายผลิต", Phone: "101", Shift: "Team A", Goal: "เลิก", Target: "เครื่องดื่มแอลกอฮอล์", Duration: "3 เดือน", Timestamp: "2026-07-01 08:30:12" },
  { EmployeeID: "0002", FirstName: "สมหญิง", LastName: "เรียนดี", Department: "ฝ่ายขาย", Phone: "204", Shift: "Team B", Goal: "ลด", Target: "บุหรี่", Duration: "2 เดือน", Timestamp: "2026-07-02 09:15:43" },
  { EmployeeID: "0003", FirstName: "กิตติ", LastName: "มุ่งมั่น", Department: "ไอที", Phone: "404", Shift: "เช้าตลอด", Goal: "เลิก", Target: "ทั้ง 2 อย่าง", Duration: "3 เดือน", Timestamp: "2026-07-02 11:24:00" },
  { EmployeeID: "0004", FirstName: "นภา", LastName: "สว่างไสว", Department: "บัญชี", Phone: "302", Shift: "คร่อมกะ", Goal: "ลด", Target: "เครื่องดื่มแอลกอฮอล์", Duration: "1 เดือน", Timestamp: "2026-07-03 14:05:19" },
  { EmployeeID: "0005", FirstName: "วิรุฬห์", LastName: "ก้าวหน้า", Department: "คลังสินค้า", Phone: "511", Shift: "Team A", Goal: "เลิก", Target: "บุหรี่", Duration: "3 เดือน", Timestamp: "2026-07-04 10:12:35" },
  { EmployeeID: "0006", FirstName: "รสริน", LastName: "สิริกุล", Department: "การตลาด", Phone: "601", Shift: "Team B", Goal: "ลด", Target: "ทั้ง 2 อย่าง", Duration: "2 เดือน", Timestamp: "2026-07-05 16:32:00" },
  { EmployeeID: "0026", FirstName: "สุพรรษา", LastName: "มะลิ", Department: "ฝ่ายบุคคล", Phone: "702", Shift: "เช้าตลอด", Goal: "เลิก", Target: "เครื่องดื่มแอลกอฮอล์", Duration: "3 เดือน", Timestamp: "2026-07-06 09:44:21" }
];

// Default Mock Surveys (to showcase success and failed rates in Mock Mode)
const DEFAULT_MOCK_SURVEYS = [
  { EmployeeID: "0001", FirstName: "สมชาย", LastName: "รักดี", Department: "ฝ่ายผลิต", Achieved: "ทำได้", Reason: "", Timestamp: "2026-08-26 08:35:10" },
  { EmployeeID: "0002", FirstName: "สมหญิง", LastName: "เรียนดี", Department: "ฝ่ายขาย", Achieved: "ทำได้", Reason: "", Timestamp: "2026-08-26 09:12:05" },
  { EmployeeID: "0003", FirstName: "กิตติ", LastName: "มุ่งมั่น", Department: "ไอที", Achieved: "ทำไม่ได้", Reason: "มีงานสังสรรค์ครอบครัวและทนความอยากบุหรี่ในช่วงสัปดาห์ที่ 4 ไม่ไหว", Timestamp: "2026-08-26 10:45:19" },
  { EmployeeID: "0004", FirstName: "นภา", LastName: "สว่างไสว", Department: "บัญชี", Achieved: "ทำได้", Reason: "", Timestamp: "2026-08-26 11:20:00" },
  { EmployeeID: "0026", FirstName: "สุพรรษา", LastName: "มะลิ", Department: "ฝ่ายบุคคล", Achieved: "ทำได้", Reason: "", Timestamp: "2026-08-26 13:05:44" }
];

/* ==========================================================================
   1. CORE INITIALIZATION
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  initNavigation();
  initFormEvents();
  initDateCheck();
  initAdminEvents();
  initLuckyDrawSpin();
  
  // Initially pull data
  syncData();
});

// Load Settings from LocalStorage
function loadSettings() {
  const savedUrl = localStorage.getItem("lent_api_url");
  const savedMode = localStorage.getItem("lent_operation_mode");
  const savedPw = localStorage.getItem("lent_admin_password");
  
  if (savedUrl) STATE.apiSettings.apiUrl = savedUrl;
  
  // Force Online Mode to prevent browser getting stuck in Mock Mode
  STATE.apiSettings.isMockMode = false;
  localStorage.setItem("lent_api_mode", "online");
  localStorage.setItem("lent_operation_mode", "online");
  
  if (savedPw) STATE.project.adminPassword = savedPw;
  
  // Set UI elements based on loaded settings
  document.getElementById("setting-api-url").value = STATE.apiSettings.apiUrl;
  document.getElementById("setting-admin-pw").value = STATE.project.adminPassword;
  
  const modeRadios = document.getElementsByName("setting-mode");
  for (let r of modeRadios) {
    if (r.value === (STATE.apiSettings.isMockMode ? "mock" : "online")) {
      r.checked = true;
    }
  }
  
  toggleApiUrlField();
  updateModeBadges();
}

// Toggle display of API URL field depending on mode
function toggleApiUrlField() {
  const isMock = document.querySelector('input[name="setting-mode"]:checked').value === "mock";
  const urlGroup = document.getElementById("setting-url-group");
  urlGroup.style.display = isMock ? "none" : "block";
}

// Update badges on the header
function updateModeBadges() {
  const mockBadge = document.getElementById("mock-badge");
  const onlineBadge = document.getElementById("online-badge");
  
  if (STATE.apiSettings.isMockMode) {
    mockBadge.style.display = "inline-flex";
    onlineBadge.style.display = "none";
  } else {
    mockBadge.style.display = "none";
    onlineBadge.style.display = "inline-flex";
    if (!STATE.apiSettings.apiUrl) {
      onlineBadge.innerText = "เตือน: ยังไม่กรอก Web App URL";
      onlineBadge.className = "badge badge-warning";
    } else {
      onlineBadge.innerText = "เชื่อมต่อ Google Sheet (Online)";
      onlineBadge.className = "badge badge-success";
    }
  }
}

// Navigation Tabs Handler (Supports Desktop Sidebar and Mobile Bottom Bar)
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item, .mobile-nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = item.getAttribute("data-page");
      switchTab(pageId);
    });
  });
}

function switchTab(pageId) {
  // Hide all pages, remove active classes
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(nav => nav.classList.remove("active"));
  
  // Show target page
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add("active");
  
  // Highlight navigation item(s) matching data-page
  document.querySelectorAll(`[data-page="${pageId}"]`).forEach(nav => nav.classList.add("active"));
  
  // Check admin panel auth state
  if (pageId === "admin-page") {
    if (STATE.adminAuthenticated) {
      document.getElementById("admin-auth-container").style.display = "none";
      document.getElementById("admin-content-container").style.display = "block";
      
      // Default to active subpage or admin-dashboard-sub
      const activeBtn = document.querySelector(".admin-tab-btn.active");
      const activeSubpage = activeBtn ? activeBtn.getAttribute("data-subpage") : "admin-dashboard-sub";
      switchAdminSubpage(activeSubpage);
    } else {
      document.getElementById("admin-auth-container").style.display = "block";
      document.getElementById("admin-content-container").style.display = "none";
      document.getElementById("admin-input-pw").value = "";
    }
  }
}

function switchAdminSubpage(subpageId) {
  document.querySelectorAll(".admin-subpage").forEach(sp => sp.classList.remove("active"));
  document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
  
  const targetSubpage = document.getElementById(subpageId);
  if (targetSubpage) targetSubpage.classList.add("active");
  
  const btn = document.querySelector(`.admin-tab-btn[data-subpage="${subpageId}"]`);
  if (btn) btn.classList.add("active");
  
  if (subpageId === "admin-dashboard-sub") {
    renderDashboardCharts();
  } else if (subpageId === "admin-luckydraw-sub") {
    setupLuckyDrawPage();
  }
}

function initAdminEvents() {
  const loginBtn = document.getElementById("btn-login-admin");
  if (loginBtn) {
    loginBtn.addEventListener("click", handleAdminLogin);
  }
  
  const pwInput = document.getElementById("admin-input-pw");
  if (pwInput) {
    pwInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdminLogin();
      }
    });
  }
  
  const logoutBtn = document.getElementById("btn-logout-admin");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      STATE.adminAuthenticated = false;
      document.getElementById("admin-auth-container").style.display = "block";
      document.getElementById("admin-content-container").style.display = "none";
      document.getElementById("admin-input-pw").value = "";
    });
  }
  
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const subpage = btn.getAttribute("data-subpage");
      switchAdminSubpage(subpage);
    });
  });

  // Set up Line template text area with current site URL
  const templateTextarea = document.getElementById("admin-line-template");
  if (templateTextarea) {
    const currentURL = window.location.href.split('?')[0]; // Strip query parameters
    const messageText = `🔔 ประชาสัมพันธ์: ขอเชิญร่วมตอบแบบประเมินผลโครงการ "ลด ละ เลิก 90 วัน ช่วงเข้าพรรษา"\n\n` +
      `เรียน พี่ๆ เพื่อนๆ พนักงานที่ลงทะเบียนเข้าร่วมโครงการทุกท่านค่ะ\n` +
      `ขณะนี้โครงการเข้าพรรษาได้ดำเนินมาครบกำหนด 3 เดือนแล้ว รบกวนทุกท่านสละเวลาไม่เกิน 1 นาที เข้ามาระบุผลการปฏิญาณตนผ่านลิงก์ด้านล่างนี้ เพื่อเก็บข้อมูลและรับสิทธิ์ลุ้นรับของรางวัลขอบคุณโครงการ (จำนวน 5 รางวัล) ค่ะ 🎁\n\n` +
      `🔗 คลิกเพื่อทำแบบประเมินผล: ${currentURL}\n` +
      `📅 กำหนดส่งผลประเมิน: ภายในวันที่ 26 สิงหาคม 2569\n\n` +
      `*หมายเหตุ: เฉพาะผู้ที่ผ่านเกณฑ์ทำสำเร็จและร่วมตอบแบบสอบถามเท่านั้น ที่จะมีชื่อไปสุ่มรับของรางวัลใหญ่นะคะ! ขอขอบพระคุณในความร่วมมือค่ะ 🙏`;
    templateTextarea.value = messageText;
  }

  // Copy template listener
  const copyBtn = document.getElementById("btn-copy-template");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const ta = document.getElementById("admin-line-template");
      if (ta) {
        ta.select();
        ta.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard.writeText(ta.value)
          .then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "✅ คัดลอกสำเร็จแล้ว!";
            copyBtn.style.backgroundColor = "#059669"; // Emerald success
            setTimeout(() => {
              copyBtn.innerText = originalText;
              copyBtn.style.backgroundColor = "";
            }, 2000);
          })
          .catch(err => {
            alert("ไม่สามารถคัดลอกได้อัตโนมัติ กรุณากดเลือกครอบแล้วคัดลอกด้วยตนเองค่ะ");
          });
      }
    });
  }

  // Survey central lock control listener
  const surveyToggle = document.getElementById("admin-survey-status-toggle");
  if (surveyToggle) {
    surveyToggle.addEventListener("change", handleAdminSurveyToggle);
  }
}

function handleAdminLogin() {
  const pwVal = document.getElementById("admin-input-pw").value.trim();
  if (pwVal === STATE.project.adminPassword) {
    STATE.adminAuthenticated = true;
    document.getElementById("admin-auth-container").style.display = "none";
    document.getElementById("admin-content-container").style.display = "block";
    switchAdminSubpage("admin-dashboard-sub");
  } else {
    alert("รหัสผ่านไม่ถูกต้อง กรุณาระบุรหัสผ่านเข้าใช้งานแอดมินใหม่อีกครั้งค่ะ");
  }
}


/* ==========================================================================
   2. DATA SYNCHRONIZATION (JSONP AND LOCAL STORAGE)
   ========================================================================== */

// Helper function for JSONP requests to bypass CORS
function fetchJSONP(url) {
  showLoader(true);
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_cb_' + Math.floor(Math.random() * 1000000);
    const script = document.createElement("script");
    
    // Add callback handler to window
    window[callbackName] = function(data) {
      resolve(data);
      cleanup();
    };
    
    function cleanup() {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window[callbackName];
      showLoader(false);
    }
    
    // Append parameters
    const urlObj = new URL(url);
    urlObj.searchParams.set("prefix", callbackName);
    
    script.src = urlObj.toString();
    script.onerror = () => {
      reject(new Error("การเชื่อมต่อระบบล้มเหลว กรุณาตรวจสอบอินเทอร์เน็ตหรือ Web App URL"));
      cleanup();
    };
    
    document.body.appendChild(script);
  });
}

// Sync all data from Mock DB or Google Sheet API
async function syncData() {
  if (STATE.apiSettings.isMockMode) {
    // Load local mock database or state
    loadMockData();
    updateModeBadges();
    calculateStats();
    return;
  }
  
  if (!STATE.apiSettings.apiUrl) {
    alert("กรุณากรอกลิ้งค์ Web App URL ในหน้าการตั้งค่าระบบเพื่อเชื่อมต่อ Google Sheet");
    switchTab("settings-page");
    return;
  }
  
  try {
    const response = await fetchJSONP(`${STATE.apiSettings.apiUrl}?action=getAllData`);
    if (response && response.success) {
      STATE.employees = response.data.employees || [];
      STATE.registrations = response.data.registrations || [];
      STATE.surveys = response.data.surveys || [];
      STATE.winners = response.data.winners || [];
      
      if (response.data.config) {
        STATE.config = response.data.config;
      }
      
      // Update survey page availability and admin toggle state based on central config
      const isOpen = STATE.config.SurveyOpen === "true";
      updateSurveyAvailability(isOpen);
      updateAdminSurveyToggleUI(isOpen);
      
      calculateStats();
      updateModeBadges();
    } else {
      alert("ไม่สามารถดึงข้อมูลได้: " + (response.error || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ"));
    }
  } catch (err) {
    alert(err.message);
  }
}

// Initialize Local Mock Data
function loadMockData() {
  // Load employees list
  STATE.employees = DEFAULT_EMPLOYEE_DB;
  
  // Load registrations from localStorage or defaults
  const savedReg = localStorage.getItem("mock_registrations");
  if (savedReg) {
    STATE.registrations = JSON.parse(savedReg);
  } else {
    STATE.registrations = [...DEFAULT_MOCK_REGISTRATIONS];
    localStorage.setItem("mock_registrations", JSON.stringify(STATE.registrations));
  }
  
  // Load surveys from localStorage or defaults
  const savedSurveys = localStorage.getItem("mock_surveys");
  if (savedSurveys) {
    STATE.surveys = JSON.parse(savedSurveys);
  } else {
    STATE.surveys = [...DEFAULT_MOCK_SURVEYS];
    localStorage.setItem("mock_surveys", JSON.stringify(STATE.surveys));
  }

  // Load winners
  const savedWinners = localStorage.getItem("mock_winners");
  if (savedWinners) {
    STATE.winners = JSON.parse(savedWinners);
  } else {
    STATE.winners = [];
    localStorage.setItem("mock_winners", JSON.stringify(STATE.winners));
  }

  // Load mock config
  const savedConfig = localStorage.getItem("mock_config_survey_open");
  if (savedConfig) {
    STATE.config.SurveyOpen = savedConfig;
  } else {
    STATE.config.SurveyOpen = "false";
    localStorage.setItem("mock_config_survey_open", "false");
  }
  
  const isOpen = STATE.config.SurveyOpen === "true";
  updateSurveyAvailability(isOpen);
  updateAdminSurveyToggleUI(isOpen);
}

// Show/Hide Full Screen Loader
function showLoader(show) {
  const loader = document.getElementById("global-loader");
  loader.style.display = show ? "flex" : "none";
}

/* ==========================================================================
   3. FORMS AND AUTOFILL FUNCTIONALITY
   ========================================================================== */

function initFormEvents() {
  // 1. Employee lookup in Registration
  document.getElementById("btn-search-employee").addEventListener("click", () => {
    lookupEmployee("reg-empid", "reg-firstname", "reg-lastname", "reg-department");
  });
  // Trigger lookup on Enter key
  document.getElementById("reg-empid").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupEmployee("reg-empid", "reg-firstname", "reg-lastname", "reg-department");
    }
  });

  // 2. Employee lookup in Survey
  document.getElementById("btn-search-survey").addEventListener("click", () => {
    lookupRegisteredParticipant();
  });
  document.getElementById("survey-empid").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupRegisteredParticipant();
    }
  });

  // 3. Toggle Survey reason input based on achievement radio
  const surveyAchievedRadios = document.getElementsByName("survey-achieved");
  for (let r of surveyAchievedRadios) {
    r.addEventListener("change", (e) => {
      const reasonGroup = document.getElementById("survey-reason-group");
      const reasonText = document.getElementById("survey-reason");
      if (e.target.value === "ทำไม่ได้") {
        reasonGroup.style.display = "block";
        reasonText.required = true;
        reasonText.disabled = false;
      } else {
        reasonGroup.style.display = "none";
        reasonText.required = false;
        reasonText.disabled = true;
      }
    });
  }

  // 4. Submit Registration
  document.getElementById("register-form").addEventListener("submit", handleRegisterFormSubmit);

  // 5. Submit Survey
  document.getElementById("survey-form").addEventListener("submit", handleSurveyFormSubmit);

  // 6. Submit Settings Form
  document.getElementById("settings-form").addEventListener("submit", handleSettingsFormSubmit);

  // 6.1 Toggle display of Web App URL when setting mode is toggled
  const settingModeRadios = document.getElementsByName("setting-mode");
  for (let r of settingModeRadios) {
    r.addEventListener("change", toggleApiUrlField);
  }

  // 7. Refresh Data manual trigger
  document.getElementById("btn-sync-data").addEventListener("click", async () => {
    await syncData();
    alert("อัปเดตข้อมูลเรียลไทม์เรียบร้อยแล้วค่ะ!");
  });

  // 7.1 Clear LocalStorage trigger
  const clearStorageBtn = document.getElementById("btn-clear-storage");
  if (clearStorageBtn) {
    clearStorageBtn.addEventListener("click", () => {
      if (confirm("คุณต้องการล้างข้อมูลทั้งหมดใน LocalStorage (รวมถึง URL เชื่อมต่อและรหัสผ่านแอดมิน) ใช่หรือไม่?")) {
        localStorage.clear();
        alert("ล้างข้อมูล LocalStorage เรียบร้อยแล้วค่ะ ระบบจะทำการโหลดหน้าเว็บใหม่");
        window.location.reload();
      }
    });
  }

  // 8. Close Encouragement Popup Modal
  document.getElementById("btn-close-encourage").addEventListener("click", () => {
    document.getElementById("encouragement-overlay").style.display = "none";
    document.getElementById("register-form").reset();
    // Clear read-only inputs
    document.getElementById("reg-firstname").value = "";
    document.getElementById("reg-lastname").value = "";
    document.getElementById("reg-department").value = "";
  });
}

// Lookup Employee ID (Supports autocomplete name & padding leading zero)
function lookupEmployee(inputId, firstNameId, lastNameId, deptId) {
  const inputEl = document.getElementById(inputId);
  let empId = inputEl.value.trim();
  
  if (!empId) {
    alert("กรุณากรอกรหัสพนักงานก่อนสืบค้นค่ะ");
    return;
  }

  // Format with leading zero: pad to 4 digits if digits-only
  if (/^\d+$/.test(empId) && empId.length < 4) {
    empId = empId.padStart(4, '0');
    inputEl.value = empId; // update in UI
  }

  // Look in STATE.employees (either fetched from Name sheet or mock)
  const employee = STATE.employees.find(e => String(e.EmployeeID).trim() === empId);
  
  if (employee) {
    document.getElementById(firstNameId).value = employee.FirstName;
    document.getElementById(lastNameId).value = employee.LastName;
    document.getElementById(deptId).value = employee.Department;
    
    // Check if already registered
    const isRegistered = STATE.registrations.some(r => String(r.EmployeeID).trim() === empId);
    const msgBox = document.getElementById("reg-msg-box");
    
    if (isRegistered) {
      msgBox.innerText = "แจ้งเตือน: รหัสพนักงานนี้เคยลงทะเบียนในระบบเรียบร้อยแล้วค่ะ";
      msgBox.className = "alert alert-warning";
      msgBox.style.display = "block";
    } else {
      msgBox.style.display = "none";
    }
  } else {
    alert("ไม่พบข้อมูลรหัสพนักงานในฐานข้อมูลรายชื่อพนักงานองค์กร กรุณาติดต่อฝ่ายบุคคล หรือระบุรหัสพนักงานใหม่อีกครั้งค่ะ");
    document.getElementById(firstNameId).value = "";
    document.getElementById(lastNameId).value = "";
    document.getElementById(deptId).value = "";
    document.getElementById("reg-msg-box").style.display = "none";
  }
}

// Lookup Employee in Registrations list to prepare Survey
function lookupRegisteredParticipant() {
  const inputEl = document.getElementById("survey-empid");
  let empId = inputEl.value.trim();
  
  if (!empId) {
    alert("กรุณากรอกรหัสพนักงานก่อนตรวจสอบค่ะ");
    return;
  }

  // Format with leading zero
  if (/^\d+$/.test(empId) && empId.length < 4) {
    empId = empId.padStart(4, '0');
    inputEl.value = empId;
  }

  // Check if they are registered
  const registration = STATE.registrations.find(r => String(r.EmployeeID).trim() === empId);
  const profileBox = document.getElementById("survey-profile-box");
  const msgBox = document.getElementById("survey-msg-box");
  
  // Reset fields
  profileBox.style.display = "none";
  msgBox.style.display = "none";
  
  if (registration) {
    // Check if already submitted survey
    const isSurveyed = STATE.surveys.some(s => String(s.EmployeeID).trim() === empId);
    if (isSurveyed) {
      msgBox.innerText = "รหัสพนักงานนี้เคยทำแบบประเมินผลสำเร็จเรียบร้อยแล้วค่ะ ขอขอบพระคุณสำหรับข้อมูลค่ะ";
      msgBox.className = "alert alert-warning";
      msgBox.style.display = "block";
      disableSurveyFormInputs(true);
      return;
    }

    // Load details to UI
    document.getElementById("survey-found-name").innerText = `${registration.FirstName} ${registration.LastName}`;
    document.getElementById("survey-found-dept").innerText = registration.Department;
    document.getElementById("survey-found-goal").innerText = registration.Goal;
    document.getElementById("survey-found-target").innerText = registration.Target;
    document.getElementById("survey-found-duration").innerText = registration.Duration;
    
    profileBox.style.display = "flex";
    disableSurveyFormInputs(false);
  } else {
    alert("ไม่พบข้อมูลการลงทะเบียนเข้าร่วมสำหรับรหัสพนักงานนี้ กรุณาลงทะเบียนเข้าร่วมโครงการก่อนทำแบบสอบถามประเมินผลค่ะ");
    disableSurveyFormInputs(true);
  }
}

// Enable/Disable survey inputs depending on lookup status
function disableSurveyFormInputs(disabled) {
  const achievedRadios = document.getElementsByName("survey-achieved");
  const reasonText = document.getElementById("survey-reason");
  const submitBtn = document.getElementById("btn-submit-survey");

  for (let r of achievedRadios) {
    r.disabled = disabled;
  }
  
  // Keep reason disabled unless "ทำไม่ได้" is active
  const isFailedActive = document.querySelector('input[name="survey-achieved"]:checked').value === "ทำไม่ได้";
  reasonText.disabled = disabled || !isFailedActive;
  submitBtn.disabled = disabled;
}

// Registration form submission handler
async function handleRegisterFormSubmit(e) {
  e.preventDefault();
  
  const empId = document.getElementById("reg-empid").value.trim();
  const firstName = document.getElementById("reg-firstname").value.trim();
  const lastName = document.getElementById("reg-lastname").value.trim();
  const department = document.getElementById("reg-department").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const shift = document.querySelector('input[name="reg-shift"]:checked').value;
  const goal = document.querySelector('input[name="reg-goal"]:checked').value;
  const target = document.querySelector('input[name="reg-target"]:checked').value;
  const duration = document.querySelector('input[name="reg-duration"]:checked').value;

  if (!firstName || !lastName) {
    alert("กรุณาค้นหารหัสพนักงานและตรวจสอบชื่อ-นามสกุลให้เรียบร้อยก่อนทำการลงทะเบียนค่ะ");
    return;
  }

  // Validate internal phone
  if (!/^\d{1,4}$/.test(phone)) {
    alert("กรุณากรอกเบอร์โทรศัพท์ภายในเฉพาะตัวเลขความยาว 1 ถึง 4 หลักค่ะ");
    return;
  }

  const payload = {
    action: "register",
    employeeId: empId,
    firstName: firstName,
    lastName: lastName,
    department: department,
    phone: phone,
    shift: shift,
    goal: goal,
    target: target,
    duration: duration
  };

  if (STATE.apiSettings.isMockMode) {
    // Check local duplicate
    if (STATE.registrations.some(r => String(r.EmployeeID).trim() === empId)) {
      alert("รหัสพนักงานนี้ได้ลงทะเบียนเข้าร่วมโครงการเรียบร้อยแล้วค่ะ");
      return;
    }
    
    // Add to local state
    payload.Timestamp = `${STATE.project.systemDate} 10:45:00`;
    STATE.registrations.push({
      EmployeeID: empId,
      FirstName: firstName,
      LastName: lastName,
      Department: department,
      Phone: phone,
      Shift: shift,
      Goal: goal,
      Target: target,
      Duration: duration,
      Timestamp: payload.Timestamp
    });
    localStorage.setItem("mock_registrations", JSON.stringify(STATE.registrations));
    showEncouragementModal(firstName, lastName, goal, target, duration);
  } else {
    // Send to Google Sheet
    try {
      const url = `${STATE.apiSettings.apiUrl}?action=registerJSONP&payload=${encodeURIComponent(JSON.stringify(payload))}`;
      const response = await fetchJSONP(url);
      if (response && response.success) {
        // Sync layout
        await syncData();
        showEncouragementModal(firstName, lastName, goal, target, duration);
      } else {
        alert("ข้อผิดพลาดจากเซิร์ฟเวอร์: " + (response.error || "บันทึกข้อมูลไม่สำเร็จ"));
      }
    } catch (err) {
      alert(err.message);
    }
  }
}

// Display personalized modal overlay
function showEncouragementModal(firstName, lastName, goal, target, duration) {
  document.getElementById("encourage-name").innerText = `ขอร่วมส่งกำลังใจให้คุณ ${firstName} ${lastName}!`;
  document.getElementById("encourage-goal").innerText = goal;
  document.getElementById("encourage-target").innerText = target;
  document.getElementById("encourage-duration").innerText = duration;
  
  // Set dynamic color of goal text
  const goalEl = document.getElementById("encourage-goal");
  if (goal === "เลิก") {
    goalEl.className = "highlight-green";
  } else {
    goalEl.className = "highlight-orange";
  }
  
  document.getElementById("encouragement-overlay").style.display = "flex";
  
  // Launch celebration confetti
  triggerConfetti();
}

// Survey form submission handler
async function handleSurveyFormSubmit(e) {
  e.preventDefault();

  const empId = document.getElementById("survey-empid").value.trim();
  const achieved = document.querySelector('input[name="survey-achieved"]:checked').value;
  const reason = achieved === "ทำไม่ได้" ? document.getElementById("survey-reason").value.trim() : "";

  const registration = STATE.registrations.find(r => String(r.EmployeeID).trim() === empId);
  if (!registration) {
    alert("ไม่พบรหัสผู้ลงทะเบียน");
    return;
  }

  const payload = {
    action: "submitSurvey",
    employeeId: empId,
    achieved: achieved,
    reason: reason
  };

  if (STATE.apiSettings.isMockMode) {
    if (STATE.surveys.some(s => String(s.EmployeeID).trim() === empId)) {
      alert("รหัสพนักงานนี้เคยทำแบบประเมินผลสำเร็จไปแล้วในระบบค่ะ");
      return;
    }
    
    payload.Timestamp = `${STATE.project.systemDate} 11:30:20`;
    STATE.surveys.push({
      EmployeeID: empId,
      FirstName: registration.FirstName,
      LastName: registration.LastName,
      Department: registration.Department,
      Achieved: achieved,
      Reason: reason,
      Timestamp: payload.Timestamp
    });
    localStorage.setItem("mock_surveys", JSON.stringify(STATE.surveys));
    
    alert(achieved === "ทำได้" 
      ? `บันทึกแบบประเมินสำเร็จ ยินดีด้วยที่คุณรักษาสัจจะคำปฏิญาณสำเร็จตลอดโครงการค่ะ! 🎉` 
      : `บันทึกแบบประเมินเรียบร้อยแล้วค่ะ ขอบคุณที่ร่วมส่งผลข้อมูลนะคะ สุขภาพของคุณก็ยังคงก้าวหน้าต่อไปค่ะ!`
    );
    
    if (achieved === "ทำได้") triggerConfetti();
    
    resetSurveyForm();
    calculateStats();
  } else {
    try {
      const url = `${STATE.apiSettings.apiUrl}?action=submitSurveyJSONP&payload=${encodeURIComponent(JSON.stringify(payload))}`;
      const response = await fetchJSONP(url);
      if (response && response.success) {
        await syncData();
        alert(achieved === "ทำได้" 
          ? `บันทึกแบบประเมินสำเร็จ ยินดีด้วยที่คุณรักษาสัจจะคำปฏิญาณสำเร็จตลอดโครงการค่ะ! 🎉` 
          : `บันทึกแบบประเมินเรียบร้อยแล้วค่ะ ขอบคุณที่ร่วมส่งผลข้อมูลนะคะ!`
        );
        if (achieved === "ทำได้") triggerConfetti();
        resetSurveyForm();
      } else {
        alert("ข้อผิดพลาดจากเซิร์ฟเวอร์: " + (response.error || "บันทึกข้อมูลไม่สำเร็จ"));
      }
    } catch (err) {
      alert(err.message);
    }
  }
}

function resetSurveyForm() {
  document.getElementById("survey-form").reset();
  document.getElementById("survey-profile-box").style.display = "none";
  document.getElementById("survey-msg-box").style.display = "none";
  document.getElementById("survey-reason-group").style.display = "none";
  disableSurveyFormInputs(true);
}

// Settings Form Submit Handler
function handleSettingsFormSubmit(e) {
  e.preventDefault();
  
  const modeVal = "online"; // Force online mode directly
  const urlVal = document.getElementById("setting-api-url").value.trim();
  const pwVal = document.getElementById("setting-admin-pw").value.trim();
  
  if (!urlVal) {
    alert("กรุณากรอก Web App URL");
    return;
  }
  
  STATE.apiSettings.isMockMode = false;
  STATE.apiSettings.apiUrl = urlVal;
  STATE.project.adminPassword = pwVal;
  
  localStorage.setItem("lent_api_url", urlVal);
  localStorage.setItem("lent_operation_mode", "online");
  localStorage.setItem("lent_api_mode", "online");
  localStorage.setItem("lent_admin_password", pwVal);
  
  toggleApiUrlField();
  updateModeBadges();
  
  // Alert settings success and refresh data
  const msgEl = document.getElementById("settings-msg-box");
  msgEl.innerText = "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว กำลังดึงข้อมูลอัปเดต...";
  msgEl.className = "alert alert-success";
  msgEl.style.display = "block";
  
  setTimeout(async () => {
    await syncData();
    msgEl.style.display = "none";
    alert("บันทึกการตั้งค่าระบบและอัปเดตสถิติสมบูรณ์แล้วค่ะ!");
  }, 1000);
}

/* ==========================================================================
   4. CENTRAL SURVEY ACCESS LOCK CONTROL
   ========================================================================== */

function initDateCheck() {
  // Set default system date display
  const systemDateDisplay = document.getElementById("system-date-display");
  if (systemDateDisplay) {
    systemDateDisplay.innerText = formatDateThai(STATE.project.systemDate);
  }
  
  // Perform survey lock check initially based on state
  updateSurveyAvailability(STATE.config.SurveyOpen === "true");
}

function updateSurveyAvailability(enable) {
  const container = document.getElementById("survey-form-container");
  if (!container) return;
  const warn = document.getElementById("survey-date-warning");
  const inputEl = document.getElementById("survey-empid");
  const searchBtn = document.getElementById("btn-search-survey");
  const descEl = document.getElementById("survey-status-desc");
  
  if (enable) {
    container.classList.remove("disabled-container");
    inputEl.disabled = false;
    searchBtn.disabled = false;
    if (warn) warn.className = "alert alert-success";
    if (descEl) descEl.innerHTML = `🎉 **ระบบประเมินผลเปิดให้กรอกข้อมูลแล้ว** (ผู้ดูแลโครงการเปิดระบบอนุญาตให้บันทึกผลได้)`;
  } else {
    container.classList.add("disabled-container");
    inputEl.disabled = true;
    searchBtn.disabled = true;
    if (warn) warn.className = "alert alert-warning";
    if (descEl) descEl.innerHTML = `🔒 **แจ้งเตือนจากโครงการ:** แบบประเมินผลสัมฤทธิ์ครบ 3 เดือน **ยังไม่เปิดให้กรอกข้อมูล** ในขณะนี้ กรุณารอประกาศแจ้งเปิดระบบจากเจ้าหน้าที่โครงการค่ะ`;
    resetSurveyForm();
  }
}

async function handleAdminSurveyToggle(e) {
  const open = e.target.checked;
  const statusStr = open ? "true" : "false";
  
  // Update status label instantly in UI
  updateAdminSurveyToggleUI(open);
  
  if (STATE.apiSettings.isMockMode) {
    STATE.config.SurveyOpen = statusStr;
    localStorage.setItem("mock_config_survey_open", statusStr);
    updateSurveyAvailability(open);
    alert("บันทึกการเปิด/ปิดสิทธิ์ทำแบบสอบถามในโหมดจำลองสำเร็จ!");
  } else {
    try {
      showLoader(true);
      const url = `${STATE.apiSettings.apiUrl}?action=setSurveyStatusJSONP&status=${statusStr}`;
      const response = await fetchJSONP(url);
      if (response && response.success) {
        STATE.config.SurveyOpen = statusStr;
        updateSurveyAvailability(open);
        alert("อัปเดตสิทธิ์การกรอกแบบประเมินไปยัง Google Sheets สำเร็จ!");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกค่า: " + (response.error || "ไม่สามารถเชื่อมต่อได้"));
        e.target.checked = !open; // Revert checkbox state
        updateAdminSurveyToggleUI(!open);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: " + err.message);
      e.target.checked = !open; // Revert
      updateAdminSurveyToggleUI(!open);
    } finally {
      showLoader(false);
    }
  }
}

function updateAdminSurveyToggleUI(open) {
  const label = document.getElementById("admin-survey-status-label");
  const surveyToggle = document.getElementById("admin-survey-status-toggle");
  if (surveyToggle) surveyToggle.checked = open;
  if (label) {
    if (open) {
      label.innerText = "🟢 เปิดระบบทำแบบประเมินแล้ว (พนักงานสามารถประเมินได้)";
      label.style.color = "var(--success-dark)";
    } else {
      label.innerText = "🔴 ปิดระบบทำแบบประเมิน (พนักงานประเมินไม่ได้)";
      label.style.color = "var(--danger-dark)";
    }
  }
}

// Convert date string YYYY-MM-DD to beautiful Thai date format
function formatDateThai(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "อ.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543; // convert to Buddhist Era (B.E.)
  return `${day} ${month} ${year}`;
}

/* ==========================================================================
   5. REAL-TIME STATS AND CHARTS
   ========================================================================== */

let stats = {
  totalReg: 0,
  totalSurvey: 0,
  successCount: 0,
  failCount: 0,
  successPct: 0,
  failPct: 0
};

// Calculate all statistics based on current registrations and surveys
function calculateStats() {
  stats.totalReg = STATE.registrations.length;
  stats.totalSurvey = STATE.surveys.length;
  
  stats.successCount = STATE.surveys.filter(s => s.Achieved === "ทำได้").length;
  stats.failCount = STATE.surveys.filter(s => s.Achieved === "ทำไม่ได้").length;
  
  stats.successPct = stats.totalSurvey > 0 ? Math.round((stats.successCount / stats.totalSurvey) * 100) : 0;
  stats.failPct = stats.totalSurvey > 0 ? Math.round((stats.failCount / stats.totalSurvey) * 100) : 0;
  
  // Update UI stats indicators
  document.getElementById("dash-total-reg").innerText = stats.totalReg;
  document.getElementById("dash-total-survey").innerText = stats.totalSurvey;
  document.getElementById("dash-survey-pct").innerText = stats.totalReg > 0 ? Math.round((stats.totalSurvey / stats.totalReg) * 100) : 0;
  
  document.getElementById("dash-success-count").innerText = stats.successCount;
  document.getElementById("dash-success-pct").innerText = `${stats.successPct}%`;
  
  document.getElementById("dash-fail-count").innerText = stats.failCount;
  document.getElementById("dash-fail-pct").innerText = `${stats.failPct}%`;
  
  // Populate Reasons list table
  const tbody = document.getElementById("dash-reasons-table-body");
  tbody.innerHTML = "";
  
  const failedSurveys = STATE.surveys.filter(s => s.Achieved === "ทำไม่ได้");
  
  if (failedSurveys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-muted);">ไม่มีข้อมูลสถิติเหตุผลที่ปฏิบัติไม่ได้ค่ะ</td></tr>`;
  } else {
    failedSurveys.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family: var(--font-family-nums); font-weight: 600;">${s.EmployeeID}</td>
        <td style="font-weight: 500;">${s.FirstName} ${s.LastName}</td>
        <td>${s.Department}</td>
        <td style="color: var(--danger-dark); font-weight: 500;">${s.Reason}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Populate Pending List table
  const pendingTbody = document.getElementById("dash-pending-table-body");
  if (pendingTbody) {
    pendingTbody.innerHTML = "";
    
    // Find registered employee IDs
    const surveyEmpIds = STATE.surveys.map(s => String(s.EmployeeID).trim());
    const pendingParticipants = STATE.registrations.filter(r => !surveyEmpIds.includes(String(r.EmployeeID).trim()));
    
    if (pendingParticipants.length === 0) {
      pendingTbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-muted);">ไม่มีรายชื่อผู้ค้างส่งแบบประเมินค่ะ</td></tr>`;
    } else {
      pendingParticipants.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-family: var(--font-family-nums); font-weight: 600;">${p.EmployeeID}</td>
          <td style="font-weight: 500;">${p.FirstName} ${p.LastName}</td>
          <td>${p.Department}</td>
          <td style="font-family: var(--font-family-nums); font-weight: 500;">${p.Phone || "-"}</td>
        `;
        pendingTbody.appendChild(tr);
      });
    }
  }
}

// Destroy existing Chart instance safely
function destroyChart(name) {
  if (STATE.charts[name]) {
    STATE.charts[name].destroy();
  }
}

// Render/Update ChartJS configurations
function renderDashboardCharts() {
  calculateStats();

  const ctxSubstance = document.getElementById("chart-substance").getContext("2d");
  const ctxSuccess = document.getElementById("chart-success").getContext("2d");
  const ctxShift = document.getElementById("chart-shift").getContext("2d");
  const ctxDuration = document.getElementById("chart-duration").getContext("2d");

  // 1. Target Substance Breakdown
  let countsSub = { alcohol: 0, smoke: 0, both: 0 };
  STATE.registrations.forEach(r => {
    if (r.Target === "เครื่องดื่มแอลกอฮอล์") countsSub.alcohol++;
    else if (r.Target === "บุหรี่") countsSub.smoke++;
    else if (r.Target === "ทั้ง 2 อย่าง") countsSub.both++;
  });
  
  destroyChart("substance");
  STATE.charts.substance = new Chart(ctxSubstance, {
    type: 'bar',
    data: {
      labels: ['เครื่องดื่มแอลกอฮอล์', 'บุหรี่', 'ทั้ง 2 อย่าง'],
      datasets: [{
        label: 'จำนวนคน (ราย)',
        data: [countsSub.alcohol, countsSub.smoke, countsSub.both],
        backgroundColor: ['rgba(217, 119, 6, 0.75)', 'rgba(59, 130, 246, 0.75)', 'rgba(16, 185, 129, 0.75)'],
        borderColor: ['#d97706', '#3b82f6', '#10b981'],
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // 2. Success Ratio Pie/Doughnut
  destroyChart("success");
  STATE.charts.success = new Chart(ctxSuccess, {
    type: 'doughnut',
    data: {
      labels: ['ทำได้สำเร็จ', 'ทำไม่ได้'],
      datasets: [{
        data: [stats.successCount, stats.failCount],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      cutout: '60%'
    }
  });

  // 3. Shift Breakdown
  let countsShift = { teamA: 0, teamB: 0, morning: 0, overlap: 0 };
  STATE.registrations.forEach(r => {
    if (r.Shift === "Team A") countsShift.teamA++;
    else if (r.Shift === "Team B") countsShift.teamB++;
    else if (r.Shift === "เช้าตลอด") countsShift.morning++;
    else if (r.Shift === "คร่อมกะ") countsShift.overlap++;
  });

  destroyChart("shift");
  STATE.charts.shift = new Chart(ctxShift, {
    type: 'bar',
    data: {
      labels: ['Team A', 'Team B', 'เช้าตลอด', 'คร่อมกะ'],
      datasets: [{
        label: 'สัดส่วนกะทำงาน',
        data: [countsShift.teamA, countsShift.teamB, countsShift.morning, countsShift.overlap],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: '#f59e0b',
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      },
      plugins: { legend: { display: false } }
    }
  });

  // 4. Duration Choices
  let countsDur = { m1: 0, m2: 0, m3: 0 };
  STATE.registrations.forEach(r => {
    if (r.Duration === "1 เดือน") countsDur.m1++;
    else if (r.Duration === "2 เดือน") countsDur.m2++;
    else if (r.Duration === "3 เดือน") countsDur.m3++;
  });

  destroyChart("duration");
  STATE.charts.duration = new Chart(ctxDuration, {
    type: 'pie',
    data: {
      labels: ['1 เดือน', '2 เดือน', '3 เดือน'],
      datasets: [{
        data: [countsDur.m1, countsDur.m2, countsDur.m3],
        backgroundColor: ['#fcd34d', '#fb923c', '#d97706'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

/* ==========================================================================
   6. ADMIN PASSWORD FOR LUCKY WHEEL
   ========================================================================== */

// Reset authentication on setting password change or load
function setupLuckyDrawPage() {
  const container = document.getElementById("lucky-draw-container");
  if (container) container.style.display = "block";
  
  // Filter eligible participants: Achieved === "ทำได้" and NOT already in winners
  updateEligibleList();
  renderWheel();
  renderWinnersList();
}

function updateEligibleList() {
  const winnerIds = STATE.winners.map(w => String(w.EmployeeID).trim());
  
  // Find survey completed users who replied "ทำได้"
  let successUsers = STATE.surveys.filter(s => s.Achieved === "ทำได้");
  
  // Filter out those who already won
  STATE.eligibleForDraw = successUsers.filter(s => !winnerIds.includes(String(s.EmployeeID).trim()));
  
  // If in Mock Mode and no success survey respondents, auto-fill with mock names so they can test immediately
  if (STATE.apiSettings.isMockMode && STATE.eligibleForDraw.length === 0 && successUsers.length === 0) {
    // Fill mock eligible participants
    const mockSuccess = [
      { EmployeeID: "0001", FirstName: "สมชาย", LastName: "รักดี", Department: "ฝ่ายผลิต" },
      { EmployeeID: "0002", FirstName: "สมหญิง", LastName: "เรียนดี", Department: "ฝ่ายขาย" },
      { EmployeeID: "0004", FirstName: "นภา", LastName: "สว่างไสว", Department: "บัญชี" },
      { EmployeeID: "0026", FirstName: "สุพรรษา", LastName: "มะลิ", Department: "ฝ่ายบุคคล" },
      { EmployeeID: "0005", FirstName: "วิรุฬห์", LastName: "ก้าวหน้า", Department: "คลังสินค้า" },
      { EmployeeID: "0008", FirstName: "ศรัญญู", LastName: "เลิศล้ำ", Department: "ฝ่ายผลิต" }
    ];
    
    // Filter out already won ones from mock success
    STATE.eligibleForDraw = mockSuccess.filter(s => !winnerIds.includes(String(s.EmployeeID).trim()));
  }
  
  document.getElementById("lucky-eligible-count").innerText = STATE.eligibleForDraw.length;
}

/* ==========================================================================
   7. INTERACTIVE LUCKY DRAW WHEEL ENGINE
   ========================================================================== */

let wheelAngle = 0;
let wheelColors = [
  "#d97706", "#f59e0b", "#fb923c", "#fcd34d", 
  "#059669", "#10b981", "#34d399", "#a7f3d0",
  "#2563eb", "#60a5fa", "#93c5fd", "#dbeafe"
];

function renderWheel() {
  const canvas = document.getElementById("wheel-canvas");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const r = width / 2;
  
  ctx.clearRect(0, 0, width, height);
  
  const list = STATE.eligibleForDraw;
  
  // If no eligible users, draw placeholder
  if (list.length === 0) {
    ctx.beginPath();
    ctx.arc(r, r, r - 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#cbd5e1";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#94a3b8";
    ctx.stroke();
    
    ctx.fillStyle = "#475569";
    ctx.font = "bold 16px 'Kanit'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ไม่มีรายชื่อผู้มีสิทธิ์จับรางวัล", r, r);
    return;
  }
  
  const arcSize = (2 * Math.PI) / list.length;
  
  for (let i = 0; i < list.length; i++) {
    const angle = wheelAngle + i * arcSize;
    
    // Draw wedge segment
    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.arc(r, r, r - 10, angle, angle + arcSize);
    ctx.fillStyle = wheelColors[i % wheelColors.length];
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    
    // Draw text (Employee ID + Name)
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(angle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Adjust font size based on number of participants
    let fontSize = 14;
    if (list.length > 20) fontSize = 10;
    else if (list.length > 10) fontSize = 12;
    
    ctx.font = `bold ${fontSize}px 'Kanit'`;
    
    const displayText = `${list[i].EmployeeID} ${list[i].FirstName}`;
    ctx.fillText(displayText, r - 30, 0);
    ctx.restore();
  }
}

// Lucky Draw Spin Control
function initLuckyDrawSpin() {
  document.getElementById("btn-spin-wheel").addEventListener("click", spinWheel);
  document.getElementById("btn-reset-winners").addEventListener("click", resetWinners);
}

function spinWheel() {
  if (STATE.isSpinning) return;
  
  const list = STATE.eligibleForDraw;
  if (list.length === 0) {
    alert("ไม่มีรายชื่อผู้มีสิทธิ์จับรางวัลที่เหลือให้สุ่มแล้วค่ะ");
    return;
  }

  // Cap winners list to 5
  if (STATE.winners.length >= 5) {
    alert("จับสลากครบกำหนด 5 รางวัลโครงการเรียบร้อยแล้วค่ะ! หากต้องการหมุนใหม่กรุณากด 'ล้างผลรางวัลใหม่'");
    return;
  }

  STATE.isSpinning = true;
  
  // Generate random spins
  const spinCount = 5 + Math.floor(Math.random() * 5); // 5 to 10 full spins
  const segmentArc = (2 * Math.PI) / list.length;
  
  // Pick random winner index
  const winnerIndex = Math.floor(Math.random() * list.length);
  
  // Calculate target angle to align selected segment under the pointer (at 12 o'clock / -Math.PI/2)
  // segment center angle = winnerIndex * segmentArc + segmentArc/2
  // pointer angle = -Math.PI / 2 (or 3/2 * Math.PI)
  // Target rotation angle = pointer_angle - segment_center_angle
  const targetSegmentAngle = winnerIndex * segmentArc + (segmentArc / 2);
  const finalAngle = (1.5 * Math.PI) - targetSegmentAngle + (spinCount * 2 * Math.PI);
  
  const startAngle = wheelAngle % (2 * Math.PI);
  const diffAngle = finalAngle - startAngle;
  
  const duration = 5000; // 5 seconds spin animation
  const startTime = performance.now();
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const t = Math.min(elapsed / duration, 1);
    
    // Easing out cubic: 1 - (1 - t)^3
    const factor = 1 - Math.pow(1 - t, 3);
    wheelAngle = startAngle + diffAngle * factor;
    
    renderWheel();
    
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // Completed spin!
      STATE.isSpinning = false;
      const winner = list[winnerIndex];
      handleWin(winner);
    }
  }
  
  requestAnimationFrame(animate);
}

// Winner announcement & database update
async function handleWin(winner) {
  triggerConfetti();
  
  const prizeOrder = STATE.winners.length + 1;
  const rewardName = document.getElementById("draw-reward-name").value.trim() || `รางวัลนำโชค ลำดับที่ ${prizeOrder}`;
  
  // Look up goals/targets from registrations for full detail
  const reg = STATE.registrations.find(r => String(r.EmployeeID).trim() === winner.EmployeeID);
  const goal = reg ? reg.Goal : "เลิก";
  const target = reg ? reg.Target : "บุหรี่/สุรา";

  const winnerData = {
    action: "saveWinner",
    winnerNo: `รางวัลที่ ${prizeOrder}`,
    employeeId: winner.EmployeeID,
    firstName: winner.FirstName,
    lastName: winner.LastName,
    department: winner.Department,
    goal: goal,
    target: target,
    reward: rewardName
  };

  if (STATE.apiSettings.isMockMode) {
    winnerData.Timestamp = `${STATE.project.systemDate} 12:00:00`;
    STATE.winners.push({
      Timestamp: winnerData.Timestamp,
      WinnerNo: winnerData.winnerNo,
      EmployeeID: winner.EmployeeID,
      FirstName: winner.FirstName,
      LastName: winner.LastName,
      Department: winner.Department,
      Goal: goal,
      Target: target,
      Reward: rewardName
    });
    localStorage.setItem("mock_winners", JSON.stringify(STATE.winners));
    
    announceWinnerDialog(winner, prizeOrder, rewardName);
    updateEligibleList();
    renderWheel();
    renderWinnersList();
  } else {
    // Online save to sheet
    try {
      const url = `${STATE.apiSettings.apiUrl}?action=saveWinnerJSONP&payload=${encodeURIComponent(JSON.stringify(winnerData))}`;
      const response = await fetchJSONP(url);
      if (response && response.success) {
        await syncData();
        announceWinnerDialog(winner, prizeOrder, rewardName);
        updateEligibleList();
        renderWheel();
        renderWinnersList();
      } else {
        alert("บันทึกผู้ได้รับรางวัลลงชีตไม่สำเร็จ: " + (response.error || "เกิดข้อผิดพลาด"));
      }
    } catch (err) {
      alert(err.message);
    }
  }
  
  // Reset reward text field for next spin
  document.getElementById("draw-reward-name").value = "";
}

function announceWinnerDialog(winner, prizeOrder, rewardName) {
  alert(`🎉 ขอแสดงความยินดีกับผู้โชคดี!\n\nรางวัลที่: ${prizeOrder}\nของรางวัล: ${rewardName}\n\nรหัสพนักงาน: ${winner.EmployeeID}\nคุณ: ${winner.FirstName} ${winner.LastName}\nแผนก: ${winner.Department}\n\nระบบบันทึกผลลงชีตนำโชคเรียบร้อยแล้วค่ะ!`);
}

// Render winners cards list
function renderWinnersList() {
  // Clear slots first
  for (let i = 1; i <= 5; i++) {
    const slot = document.querySelector(`.winner-slot-card[data-slot="${i}"]`);
    slot.className = "winner-slot-card";
    slot.querySelector(".slot-details").innerHTML = `<div class="slot-status">ว่าง - รอการสุ่มจับรางวัล...</div>`;
  }
  
  // Fill with active winners
  STATE.winners.forEach((w, idx) => {
    const slotNum = idx + 1;
    const slot = document.querySelector(`.winner-slot-card[data-slot="${slotNum}"]`);
    if (slot) {
      slot.className = "winner-slot-card filled";
      slot.querySelector(".slot-details").innerHTML = `
        <div class="slot-winner-title">คุณ ${w.FirstName} ${w.LastName} (${w.EmployeeID})</div>
        <div class="slot-winner-meta">แผนก: ${w.Department} | เป้าหมาย: ${w.Goal} ${w.Target}</div>
        <div class="slot-winner-reward">🎁 ของรางวัล: ${w.Reward}</div>
      `;
    }
  });
}

// Reset winners list (clear in Sheet / local)
async function resetWinners() {
  if (!confirm("คุณต้องการล้างประวัติการได้รับรางวัลทั้งหมดและเริ่มจับสลากใหม่ ใช่หรือไม่? (ผู้ที่เคยจับรางวัลไปจะถูกดึงกลับมาลุ้นสลากได้อีกครั้ง)")) {
    return;
  }
  
  if (STATE.apiSettings.isMockMode) {
    STATE.winners = [];
    localStorage.setItem("mock_winners", JSON.stringify(STATE.winners));
    alert("รีเซ็ตสถิติผู้ได้รับรางวัลเพื่อจับใหม่เรียบร้อยแล้วค่ะ");
    updateEligibleList();
    renderWheel();
    renderWinnersList();
  } else {
    try {
      const url = `${STATE.apiSettings.apiUrl}?action=clearWinnersJSONP`;
      const response = await fetchJSONP(url);
      if (response && response.success) {
        await syncData();
        alert("รีเซ็ตสถิติผู้ได้รับรางวัลเพื่อเริ่มสุ่มใหม่สำเร็จเรียบร้อยค่ะ");
        updateEligibleList();
        renderWheel();
        renderWinnersList();
      } else {
        alert("ไม่สามารถล้างข้อมูลในชีตได้: " + (response.error || "เกิดข้อผิดพลาด"));
      }
    } catch (err) {
      alert(err.message);
    }
  }
}

/* ==========================================================================
   8. CONFETTI ANIMATION SYSTEM
   ========================================================================== */

function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particleCount = 120;
  const particles = [];
  const colors = ["#d97706", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#ec4899", "#8b5cf6"];
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }
  
  let animationFrameId;
  const duration = 4000; // particle fall duration
  const startTime = Date.now();
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let active = false;
    
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - i / 3) * 15;
      
      if (p.y <= canvas.height) {
        active = true;
      }
      
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    }
    
    const elapsed = Date.now() - startTime;
    
    if (active && elapsed < duration) {
      animationFrameId = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
    }
  }
  
  draw();
}

window.addEventListener('resize', () => {
  const canvas = document.getElementById("confetti-canvas");
  if (canvas.width > 0) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});
