/**
 * Main Application - Patient Check-in Dashboard
 */

// ============================================
// DEBUG FUNCTIONS
// ============================================
let debugLogs = [];

function addDebugLog(message, data = null) {
    const entry = {
        time: new Date().toLocaleTimeString(),
        message: message,
        data: data
    };
    debugLogs.unshift(entry);
    
    // Keep only last 50 entries
    if (debugLogs.length > 50) {
        debugLogs = debugLogs.slice(0, 50);
    }
    
    renderDebugLog();
}

function renderDebugLog() {
    const logContainer = document.getElementById('debug-log');
    if (!logContainer) return;
    
    logContainer.innerHTML = debugLogs.map(entry => {
        const isError = entry.message.includes('❌') || entry.message.includes('Error');
        const isSuccess = entry.message.includes('✅') || entry.message.includes('Success');
        
        return `
            <div class="debug-log-entry">
                <div class="debug-log-time">${entry.time}</div>
                <div class="debug-log-message ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''}">${entry.message}</div>
                ${entry.data ? `<div class="debug-log-data">${JSON.stringify(entry.data, null, 2).substring(0, 300)}</div>` : ''}
            </div>
        `;
    }).join('');
}

function initDebugPanel() {
    const debugPanel = document.getElementById('debug-panel');
    const debugToggle = document.getElementById('debug-toggle');
    const debugContent = document.getElementById('debug-content');
    const debugConfig = document.getElementById('debug-config');
    const testApiBtn = document.getElementById('test-api-btn');
    const clearDebugBtn = document.getElementById('clear-debug-btn');
    const debugHeader = document.querySelector('.debug-header');
    
    if (!CONFIG.DEBUG_MODE) {
        if (debugPanel) debugPanel.style.display = 'none';
        return;
    }
    
    // Show configuration status
    if (debugConfig) {
        const apiConfigured = CONFIG.API_URL && CONFIG.API_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
        
        debugConfig.innerHTML = `
            <div class="debug-status ${apiConfigured ? 'ok' : 'error'}">
                <strong>API URL:</strong> ${apiConfigured ? '✅ Configured' : '❌ NOT CONFIGURED'}
                <br><small>${apiConfigured ? CONFIG.API_URL.substring(0, 60) + '...' : 'Please update js/config.js'}</small>
            </div>
            <div class="debug-status ok">
                <strong>Debug Mode:</strong> ✅ Enabled
            </div>
        `;
    }
    
    // Toggle panel
    if (debugHeader) {
        debugHeader.addEventListener('click', () => {
            debugContent.classList.toggle('collapsed');
            debugToggle.textContent = debugContent.classList.contains('collapsed') ? '▲' : '▼';
        });
    }
    
    // Test API button
    if (testApiBtn) {
        testApiBtn.addEventListener('click', async () => {
            const resultDiv = document.getElementById('debug-api-result');
            resultDiv.innerHTML = '<div class="debug-status warning">⏳ Testing...</div>';
            
            const result = await API.testConnection();
            
            if (result.success) {
                resultDiv.innerHTML = `
                    <div class="debug-status ok">
                        ✅ API Connection Successful!
                        <br><small>Counselors loaded: ${result.data?.counselors?.length || 0}</small>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="debug-status error">
                        ❌ API Connection Failed
                        <br><small>${result.error}</small>
                        ${result.help ? `<br><small>💡 ${result.help}</small>` : ''}
                    </div>
                `;
            }
        });
    }
    
    // Clear log button
    if (clearDebugBtn) {
        clearDebugBtn.addEventListener('click', () => {
            debugLogs = [];
            renderDebugLog();
        });
    }
    
    addDebugLog('🚀 Debug panel initialized');
    addDebugLog(`📋 API URL: ${CONFIG.API_URL ? CONFIG.API_URL.substring(0, 50) + '...' : 'NOT SET'}`);
}

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    user: null,
    currentPage: 'queue',
    currentFilter: 'All',
    patients: [],
    lastUpdate: null,
    charts: {}
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    loginScreen: document.getElementById('login-screen'),
    mainApp: document.getElementById('main-app'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    userDisplayName: document.getElementById('user-display-name'),
    logoutBtn: document.getElementById('logout-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    cacheStatus: document.getElementById('cache-status'),
    timeDisplay: document.getElementById('time-display'),
    queueDate: document.getElementById('queue-date'),
    metricsRow: document.getElementById('metrics-row'),
    queueSectionHeader: document.getElementById('queue-section-header'),
    patientList: document.getElementById('patient-list'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    searchResults: document.getElementById('search-results'),
    dateRange: document.getElementById('date-range'),
    analyticsMetrics: document.getElementById('analytics-metrics'),
    patientModal: document.getElementById('patient-modal'),
    modalClose: document.getElementById('modal-close'),
    patientDetailContent: document.getElementById('patient-detail-content'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize debug panel first
    initDebugPanel();
    
    // Check for saved session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        showMainApp();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Update time display
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
    
    addDebugLog('📱 App initialized');
});

function setupEventListeners() {
    // Login form
    elements.loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Refresh data
    elements.refreshBtn.addEventListener('click', refreshData);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Search
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Analytics date range
    elements.dateRange.addEventListener('change', loadAnalytics);
    
    // Modal close
    elements.modalClose.addEventListener('click', closeModal);
    elements.patientModal.addEventListener('click', (e) => {
        if (e.target === elements.patientModal) closeModal();
    });
}

// ============================================
// AUTHENTICATION
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    addDebugLog(`🔐 Login attempt for user: ${username}`);
    
    // Show loading
    const btn = elements.loginForm.querySelector('button');
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Signing in...';
    
    const result = await API.login(username, password);
    
    if (result.success) {
        addDebugLog(`✅ Login successful: ${result.user?.name}`);
        state.user = result.user;
        localStorage.setItem('user', JSON.stringify(result.user));
        showMainApp();
    } else {
        addDebugLog(`❌ Login failed: ${result.error}`);
        elements.loginError.textContent = result.error || 'Login failed';
        elements.loginError.classList.remove('hidden');
    }
    
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Sign In';
}

function handleLogout() {
    state.user = null;
    localStorage.removeItem('user');
    elements.mainApp.classList.add('hidden');
    elements.loginScreen.classList.remove('hidden');
    elements.loginForm.reset();
    elements.loginError.classList.add('hidden');
}

function showMainApp() {
    elements.loginScreen.classList.add('hidden');
    elements.mainApp.classList.remove('hidden');
    elements.userDisplayName.textContent = state.user.name;
    
    // Load initial data
    refreshData();
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    state.currentPage = page;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Update pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `page-${page}`);
    });
    
    // Load page-specific data
    if (page === 'analytics') {
        loadAnalytics();
    }
}

// ============================================
// DATA LOADING
// ============================================
async function refreshData() {
    elements.cacheStatus.textContent = '🔄 Loading...';
    addDebugLog('🔄 Refreshing patient data...');
    
    const result = await API.getTodaysCheckins();
    
    if (result.success) {
        state.patients = result.patients || [];
        state.lastUpdate = new Date();
        
        addDebugLog(`✅ Loaded ${state.patients.length} patients for today`);
        
        if (state.patients.length === 0) {
            addDebugLog('ℹ️ No patients checked in today. This could be normal if no one has submitted the form today.');
        } else {
            addDebugLog(`📋 First patient: ${state.patients[0]?.['First Name']} ${state.patients[0]?.['Last Name']}`);
        }
        
        renderPatientQueue();
        elements.cacheStatus.textContent = `✅ Updated ${formatTime(state.lastUpdate)}`;
    } else {
        addDebugLog(`❌ Failed to load data: ${result.error}`);
        showToast('Failed to load data: ' + result.error, 'error');
        elements.cacheStatus.textContent = '❌ Failed to load';
        
        // Show helpful message in patient list
        elements.patientList.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>⚠️ Failed to Load Data</h3>
                <p>${result.error}</p>
                <p style="margin-top: 10px; font-size: 0.9rem;">
                    Check the Debug Panel (bottom right) for more details.
                </p>
            </div>
        `;
    }
}

async function loadAnalytics() {
    const days = parseInt(elements.dateRange.value);
    const result = await API.getAnalytics(days);
    
    if (result.success) {
        renderAnalytics(result.metrics, result.charts);
    } else {
        showToast('Failed to load analytics', 'error');
    }
}

// ============================================
// PATIENT QUEUE RENDERING
// ============================================
function renderPatientQueue() {
    // Update date
    elements.queueDate.textContent = `📅 ${formatDate(new Date())} | 👤 ${state.user.name}`;
    
    // Calculate counts
    const counts = {
        all: state.patients.length,
        waiting: state.patients.filter(p => !p.Status || p.Status === 'Waiting').length,
        assigned: state.patients.filter(p => p.Status === 'Assigned').length,
        inSession: state.patients.filter(p => p.Status === 'In Session').length,
        completed: state.patients.filter(p => p.Status === 'Completed').length,
        cancelled: state.patients.filter(p => p.Status === 'Cancelled').length
    };
    
    // Render metrics
    elements.metricsRow.innerHTML = `
        <div class="metric-card ${state.currentFilter === 'All' ? 'active' : ''}" onclick="filterPatients('All')">
            <div class="metric-value">${counts.all}</div>
            <div class="metric-label">📊 All</div>
        </div>
        <div class="metric-card waiting ${state.currentFilter === 'Waiting' ? 'active' : ''}" onclick="filterPatients('Waiting')">
            <div class="metric-value">${counts.waiting}</div>
            <div class="metric-label">⏳ Waiting</div>
        </div>
        <div class="metric-card assigned ${state.currentFilter === 'Assigned' ? 'active' : ''}" onclick="filterPatients('Assigned')">
            <div class="metric-value">${counts.assigned}</div>
            <div class="metric-label">👨‍⚕️ Assigned</div>
        </div>
        <div class="metric-card in-session ${state.currentFilter === 'In Session' ? 'active' : ''}" onclick="filterPatients('In Session')">
            <div class="metric-value">${counts.inSession}</div>
            <div class="metric-label">🔵 In Session</div>
        </div>
        <div class="metric-card completed ${state.currentFilter === 'Completed' ? 'active' : ''}" onclick="filterPatients('Completed')">
            <div class="metric-value">${counts.completed}</div>
            <div class="metric-label">✅ Completed</div>
        </div>
        <div class="metric-card cancelled ${state.currentFilter === 'Cancelled' ? 'active' : ''}" onclick="filterPatients('Cancelled')">
            <div class="metric-value">${counts.cancelled}</div>
            <div class="metric-label">❌ Cancelled</div>
        </div>
    `;
    
    // Filter patients
    let filtered = state.patients;
    if (state.currentFilter !== 'All') {
        if (state.currentFilter === 'Waiting') {
            filtered = state.patients.filter(p => !p.Status || p.Status === 'Waiting');
        } else {
            filtered = state.patients.filter(p => p.Status === state.currentFilter);
        }
    }
    
    // Update section header
    const filterLabels = {
        'All': '📊 All Patients',
        'Waiting': '⏳ Waiting for Assignment',
        'Assigned': '👨‍⚕️ Assigned to Counselor',
        'In Session': '🔵 Currently In Session',
        'Completed': '✅ Completed Today',
        'Cancelled': '❌ Cancelled'
    };
    elements.queueSectionHeader.textContent = `${filterLabels[state.currentFilter]} (${filtered.length})`;
    
    // Render patient list
    if (filtered.length === 0) {
        elements.patientList.innerHTML = `<p class="hint-text">🎉 No patients with status: ${state.currentFilter}</p>`;
    } else {
        elements.patientList.innerHTML = filtered.map(p => renderPatientCard(p)).join('');
    }
}

function renderPatientCard(patient) {
    const status = patient.Status || 'Waiting';
    const waitMinutes = patient.WaitMinutes || 0;
    const counselor = patient['Assigned Counselor'] || '';
    const notes = patient.Notes || '';
    
    // Build flags
    const flags = [];
    if (patient['Do you have insurance?'] === 'Yes') {
        const insurance = patient['Name of Insurance'] || 'Insured';
        flags.push(`<span class="flag insurance">🏥 ${insurance}</span>`);
    } else if (patient['Do you have insurance?'] === 'No') {
        flags.push(`<span class="flag self-pay">💵 Self-Pay</span>`);
    }
    if (patient['Are you currently pregnant?'] === 'Yes') {
        flags.push(`<span class="flag pregnant">🤰 Pregnant</span>`);
    }
    if (patient['Can you provide a UA sample?'] === 'Yes') {
        flags.push(`<span class="flag ua-ready">🧪 UA Ready</span>`);
    }
    if (patient['Are you in a Residential Program?'] === 'Yes') {
        const program = patient['Program Name'] || 'Residential';
        flags.push(`<span class="flag residential">🏠 ${program}</span>`);
    }
    if (patient['On Methadone or Suboxone?'] === 'Yes') {
        const med = patient['Which medication?'] || 'MAT';
        flags.push(`<span class="flag mat">💊 ${med}</span>`);
    }
    
    // Wait time styling
    let waitClass = 'ok';
    if (waitMinutes >= 30) waitClass = 'critical';
    else if (waitMinutes >= 15) waitClass = 'warning';
    if (['Completed', 'Cancelled'].includes(status)) waitClass = 'done';
    
    // Time display
    const timestamp = patient.Timestamp || '';
    const timepart = timestamp.split(' ')[1] || '';
    
    // Status-specific content
    let counselorSection = '';
    let actionsSection = '';
    
    if (status === 'Waiting' || !status) {
        counselorSection = `
            <div class="counselor-section">
                <p class="counselor-label">👨‍⚕️ Assign Counselor</p>
                <select class="counselor-select" id="counselor-${patient._row}">
                    ${CONFIG.COUNSELORS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <button class="btn btn-primary btn-sm btn-block" onclick="assignAndMove(${patient._row})">
                    ✅ Assign & Move
                </button>
            </div>
        `;
        actionsSection = `
            <div class="actions-section">
                <span class="status-badge waiting">⏳ WAITING</span>
                <p style="color: #6C757D; font-size: 0.85rem;">Select counselor to assign →</p>
            </div>
        `;
    } else if (status === 'Assigned') {
        counselorSection = `
            <div class="counselor-section">
                <p class="counselor-label">👨‍⚕️ Assigned To</p>
                <div class="counselor-assigned">👨‍⚕️ ${counselor || 'Not assigned'}</div>
            </div>
        `;
        actionsSection = `
            <div class="actions-section">
                <span class="status-badge assigned">👨‍⚕️ ASSIGNED</span>
                <button class="btn btn-primary btn-sm btn-block" onclick="startSession(${patient._row})">
                    ▶️ Start Session
                </button>
                <button class="btn btn-danger btn-sm btn-block" onclick="showCancelDialog(${patient._row})">
                    ❌ Cancel Visit
                </button>
            </div>
        `;
    } else if (status === 'In Session') {
        counselorSection = `
            <div class="counselor-section">
                <p class="counselor-label">👨‍⚕️ With Counselor</p>
                <div class="counselor-assigned" style="background: #CCE5FF; color: #004085;">
                    👨‍⚕️ ${counselor || 'Not assigned'}
                </div>
            </div>
        `;
        actionsSection = `
            <div class="actions-section">
                <span class="status-badge in-session">🔵 IN SESSION</span>
                <button class="btn btn-success btn-sm btn-block" onclick="completeSession(${patient._row})">
                    ✅ Complete
                </button>
                <button class="btn btn-secondary btn-sm btn-block" onclick="backToAssigned(${patient._row})">
                    ↩️ Back to Assigned
                </button>
            </div>
        `;
    } else if (status === 'Completed') {
        counselorSection = `
            <div class="counselor-section">
                <p class="counselor-label">👨‍⚕️ Seen By</p>
                <div class="counselor-assigned" style="background: #D4EDDA; color: #155724;">
                    👨‍⚕️ ${counselor || 'Not assigned'}
                </div>
            </div>
        `;
        actionsSection = `
            <div class="actions-section">
                <span class="status-badge completed">✅ COMPLETED</span>
            </div>
        `;
    } else if (status === 'Cancelled') {
        counselorSection = counselor ? `
            <div class="counselor-section">
                <p class="counselor-label">👨‍⚕️ Was Assigned To</p>
                <div class="counselor-assigned" style="background: #F8D7DA; color: #721C24;">
                    👨‍⚕️ ${counselor}
                </div>
            </div>
        ` : '';
        actionsSection = `
            <div class="actions-section">
                <span class="status-badge cancelled">❌ CANCELLED</span>
                ${notes ? `<div class="cancel-reason-box">📝 ${notes}</div>` : ''}
                <button class="btn btn-secondary btn-sm btn-block" onclick="undoCancel(${patient._row})">
                    ↩️ Undo
                </button>
            </div>
        `;
    }
    
    return `
        <div class="patient-card">
            <div>
                <div class="patient-name">
                    ${patient['First Name']} ${patient['Last Name']}
                </div>
                <span class="patient-id">🆔 ${patient['Patient ID'] || 'N/A'}</span>
                <div class="patient-info">
                    📅 DOB: ${patient['Date of Birth'] || 'N/A'} 
                    ${patient['Phone Number'] ? `| 📞 ${patient['Phone Number']}` : ''}
                </div>
                <div class="patient-flags">${flags.join('')}</div>
                <button class="btn btn-sm btn-secondary" style="margin-top: 10px;" onclick="viewPatientDetails('${patient['Patient ID']}')">
                    📋 View Details
                </button>
            </div>
            <div>
                <p class="checkin-time">⏰ Checked in at ${timepart}</p>
                <div class="wait-time ${waitClass}">
                    ${['Completed', 'Cancelled'].includes(status) ? '✓ Visit ended' : `⏱️ ${waitMinutes} min wait`}
                </div>
            </div>
            ${counselorSection}
            ${actionsSection}
        </div>
    `;
}

function filterPatients(filter) {
    state.currentFilter = filter;
    renderPatientQueue();
}

// ============================================
// PATIENT ACTIONS
// ============================================
async function assignAndMove(row) {
    const select = document.getElementById(`counselor-${row}`);
    const counselor = select.value;
    
    if (!counselor || counselor === '-- Select Counselor --') {
        showToast('Please select a counselor', 'error');
        return;
    }
    
    // Assign counselor
    let result = await API.assignCounselor(row, counselor);
    if (!result.success) {
        showToast('Failed to assign counselor', 'error');
        return;
    }
    
    // Update status to Assigned
    result = await API.updateStatus(row, 'Assigned');
    if (result.success) {
        showToast(`Assigned to ${counselor}`, 'success');
        refreshData();
    } else {
        showToast('Failed to update status', 'error');
    }
}

async function startSession(row) {
    const result = await API.updateStatus(row, 'In Session');
    if (result.success) {
        showToast('Session started!', 'success');
        refreshData();
    } else {
        showToast('Failed to start session', 'error');
    }
}

async function completeSession(row) {
    const result = await API.updateStatus(row, 'Completed');
    if (result.success) {
        showToast('Session completed!', 'success');
        refreshData();
    } else {
        showToast('Failed to complete session', 'error');
    }
}

async function backToAssigned(row) {
    const result = await API.updateStatus(row, 'Assigned');
    if (result.success) {
        refreshData();
    } else {
        showToast('Failed to update status', 'error');
    }
}

function showCancelDialog(row) {
    const reason = prompt('Enter reason for cancellation:');
    if (reason !== null) {
        cancelVisit(row, reason);
    }
}

async function cancelVisit(row, reason) {
    // Save notes
    await API.saveNotes(row, `CANCELLED: ${reason || 'No reason provided'}`);
    
    // Update status
    const result = await API.updateStatus(row, 'Cancelled');
    if (result.success) {
        showToast('Visit cancelled', 'success');
        refreshData();
    } else {
        showToast('Failed to cancel visit', 'error');
    }
}

async function undoCancel(row) {
    // Clear notes
    await API.saveNotes(row, '');
    
    // Update status back to Waiting
    const result = await API.updateStatus(row, 'Waiting');
    if (result.success) {
        refreshData();
    } else {
        showToast('Failed to undo', 'error');
    }
}

// ============================================
// SEARCH
// ============================================
async function handleSearch() {
    const term = elements.searchInput.value.trim();
    
    if (term.length < 2) {
        showToast('Please enter at least 2 characters', 'error');
        return;
    }
    
    elements.searchResults.innerHTML = '<div class="loading">Searching...</div>';
    
    const result = await API.searchPatients(term);
    
    if (result.success) {
        if (result.patients.length === 0) {
            elements.searchResults.innerHTML = '<p class="hint-text">No patients found matching your search</p>';
        } else {
            elements.searchResults.innerHTML = `
                <p style="margin-bottom: 15px; color: var(--text-medium);">Found ${result.count} patient(s)</p>
                ${result.patients.map(p => `
                    <div class="patient-card" style="grid-template-columns: 1fr auto;">
                        <div>
                            <div class="patient-name">${p['First Name']} ${p['Last Name']}</div>
                            <span class="patient-id">🆔 ${p['Patient ID'] || 'N/A'}</span>
                            <div class="patient-info">
                                📅 DOB: ${p['Date of Birth'] || 'N/A'} | 📞 ${p['Phone Number'] || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-primary" onclick="viewPatientDetails('${p['Patient ID']}')">
                                👁️ View Details
                            </button>
                        </div>
                    </div>
                `).join('')}
            `;
        }
    } else {
        elements.searchResults.innerHTML = '<p class="hint-text">Search failed. Please try again.</p>';
    }
}

// ============================================
// PATIENT DETAILS MODAL
// ============================================
async function viewPatientDetails(patientId) {
    elements.patientModal.classList.remove('hidden');
    elements.patientDetailContent.innerHTML = '<div class="loading">Loading patient details...</div>';
    
    const result = await API.getPatientHistory(patientId);
    
    if (result.success && result.patientInfo) {
        const p = result.patientInfo;
        const stats = result.stats;
        const history = result.history;
        
        elements.patientDetailContent.innerHTML = `
            <div class="detail-header">
                <h2>👤 ${p['First Name']} ${p['Last Name']}</h2>
                <span class="patient-id">🆔 ${p['Patient ID']}</span>
            </div>
            
            <div class="section-header">📋 Patient Information</div>
            <div class="info-grid">
                <div class="info-box">
                    <div class="label">📅 Date of Birth</div>
                    <div class="value">${p['Date of Birth'] || 'N/A'}</div>
                </div>
                <div class="info-box">
                    <div class="label">📞 Phone Number</div>
                    <div class="value">${p['Phone Number'] || 'N/A'}</div>
                </div>
                <div class="info-box">
                    <div class="label">💳 Insurance</div>
                    <div class="value">${p['Do you have insurance?'] === 'Yes' ? (p['Name of Insurance'] || 'Insured') : 'Self-Pay'}</div>
                </div>
                <div class="info-box">
                    <div class="label">🏠 Residential</div>
                    <div class="value">${p['Are you in a Residential Program?'] === 'Yes' ? (p['Program Name'] || 'Yes') : 'No'}</div>
                </div>
            </div>
            
            <div class="section-header">📊 Visit Statistics</div>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="value" style="color: var(--primary-color)">${stats.totalVisits}</div>
                    <div class="label">Total Visits</div>
                </div>
                <div class="stat-box">
                    <div class="value" style="color: var(--success-color)">${stats.completed}</div>
                    <div class="label">Completed</div>
                </div>
                <div class="stat-box">
                    <div class="value" style="color: var(--danger-color)">${stats.cancelled}</div>
                    <div class="label">Cancelled</div>
                </div>
                <div class="stat-box">
                    <div class="value" style="color: ${stats.successRate >= 70 ? 'var(--success-color)' : stats.successRate >= 40 ? 'var(--warning-color)' : 'var(--danger-color)'}">${stats.successRate}%</div>
                    <div class="label">Success Rate</div>
                </div>
            </div>
            
            <div class="section-header">📜 Visit History (${history.length} visits)</div>
            <div class="visit-history">
                ${history.map((v, i) => `
                    <div class="visit-item ${(v.Status || '').toLowerCase().replace(' ', '-')}">
                        <div class="visit-header">
                            <strong>Visit #${history.length - i}</strong> - 📅 ${v.Timestamp}
                            <span class="status-badge ${(v.Status || 'waiting').toLowerCase().replace(' ', '-')}">${v.Status || 'Waiting'}</span>
                        </div>
                        ${v['Assigned Counselor'] ? `<p>👨‍⚕️ ${v['Assigned Counselor']}</p>` : ''}
                        ${v.Notes ? `<div class="visit-notes">📝 ${v.Notes}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        elements.patientDetailContent.innerHTML = '<p class="hint-text">Patient not found</p>';
    }
}

function closeModal() {
    elements.patientModal.classList.add('hidden');
}

// ============================================
// ANALYTICS
// ============================================
function renderAnalytics(metrics, charts) {
    // Render metrics
    elements.analyticsMetrics.innerHTML = `
        <div class="analytics-metric">
            <div class="value">${metrics.totalVisits}</div>
            <div class="label">Total Visits</div>
        </div>
        <div class="analytics-metric">
            <div class="value">${metrics.uniquePatients}</div>
            <div class="label">Unique Patients</div>
        </div>
        <div class="analytics-metric">
            <div class="value" style="color: var(--success-color)">${metrics.completed}</div>
            <div class="label">Completed</div>
        </div>
        <div class="analytics-metric">
            <div class="value" style="color: var(--danger-color)">${metrics.cancelled}</div>
            <div class="label">Cancelled</div>
        </div>
        <div class="analytics-metric">
            <div class="value" style="color: ${metrics.completionRate >= 70 ? 'var(--success-color)' : 'var(--warning-color)'}">${metrics.completionRate}%</div>
            <div class="label">Completion Rate</div>
        </div>
    `;
    
    // Destroy existing charts
    Object.values(state.charts).forEach(chart => chart.destroy());
    state.charts = {};
    
    // Status chart
    state.charts.status = new Chart(document.getElementById('chart-status'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(charts.status),
            datasets: [{
                data: Object.values(charts.status),
                backgroundColor: [
                    CONFIG.CHART_COLORS.warning,
                    CONFIG.CHART_COLORS.purple,
                    CONFIG.CHART_COLORS.accent,
                    CONFIG.CHART_COLORS.success,
                    CONFIG.CHART_COLORS.danger
                ]
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Day of week chart
    state.charts.days = new Chart(document.getElementById('chart-days'), {
        type: 'bar',
        data: {
            labels: Object.keys(charts.dayOfWeek),
            datasets: [{
                label: 'Check-ins',
                data: Object.values(charts.dayOfWeek),
                backgroundColor: CONFIG.CHART_COLORS.primary
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Hourly chart
    state.charts.hours = new Chart(document.getElementById('chart-hours'), {
        type: 'line',
        data: {
            labels: Object.keys(charts.hourly).map(h => `${h}:00`),
            datasets: [{
                label: 'Check-ins',
                data: Object.values(charts.hourly),
                borderColor: CONFIG.CHART_COLORS.accent,
                fill: true,
                backgroundColor: 'rgba(0, 180, 216, 0.1)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Insurance chart
    state.charts.insurance = new Chart(document.getElementById('chart-insurance'), {
        type: 'doughnut',
        data: {
            labels: ['Has Insurance', 'No Insurance'],
            datasets: [{
                data: [charts.insurance['Yes'] || 0, charts.insurance['No'] || 0],
                backgroundColor: [CONFIG.CHART_COLORS.success, CONFIG.CHART_COLORS.warning]
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Counselor chart
    const counselorLabels = Object.keys(charts.counselor);
    state.charts.counselor = new Chart(document.getElementById('chart-counselor'), {
        type: 'bar',
        data: {
            labels: counselorLabels.map(c => c.length > 15 ? c.substring(0, 15) + '...' : c),
            datasets: [{
                label: 'Patients',
                data: Object.values(charts.counselor),
                backgroundColor: CONFIG.CHART_COLORS.primary
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: true,
            indexAxis: 'y'
        }
    });
    
    // Residential chart
    state.charts.residential = new Chart(document.getElementById('chart-residential'), {
        type: 'doughnut',
        data: {
            labels: ['Residential', 'Non-Residential'],
            datasets: [{
                data: [charts.residential['Yes'] || 0, charts.residential['No'] || 0],
                backgroundColor: [CONFIG.CHART_COLORS.accent, CONFIG.CHART_COLORS.gray]
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

// ============================================
// UTILITIES
// ============================================
function updateTimeDisplay() {
    const now = new Date();
    elements.timeDisplay.textContent = `🕐 ${now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    })}`;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function showToast(message, type = 'info') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove('hidden');
    
    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 3000);
}
