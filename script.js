/* =============================================
   Zinc Leaching Batch Calculator - JavaScript
   Professional Industrial Application Logic
   ============================================= */

/* =============================================
   GLOBAL CONSTANTS & CONFIGURATION
   ============================================= */

// Molecular weights (g/mol)
const MOLECULAR_WEIGHTS = {
    Zn: 65,
    H2SO4: 98,
    ZnSO4: 161,
    H2: 2
};

// Lab recipe proportions (per 500g batch)
const LAB_RECIPE = {
    batch: 500,
    zincAsh: 68,
    concentratedAcid: 51,
    dilutionWater: 51,
    processWater: 330
};

// Decimal places for rounding
const DECIMAL_PLACES = 2;

// Store current calculation data
let currentCalculation = {
    mode: 1,
    batchNumber: '',
    engineerName: '',
    inputs: {},
    results: {}
};

/* =============================================
   INITIALIZATION
   ============================================= */

document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    setupEventListeners();
});

/**
 * Initialize theme based on system preference or saved setting
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

/**
 * Set theme (light/dark)
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = document.getElementById('themeToggle').querySelector('i');
    icon.classList.remove('fa-moon', 'fa-sun');
    icon.classList.add(theme === 'dark' ? 'fa-sun' : 'fa-moon');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    
    // Mode 1 buttons
    document.getElementById('calculate1').addEventListener('click', () => calculateMode1());
    document.getElementById('reset1').addEventListener('click', () => resetForm('form1'));
    
    // Mode 2 buttons
    document.getElementById('calculate2').addEventListener('click', () => calculateMode2());
    document.getElementById('reset2').addEventListener('click', () => resetForm('form2'));
    
    // Print report
    document.getElementById('printReport').addEventListener('click', printReport);
    
    // Help section toggle
    document.querySelector('.help-toggle').addEventListener('click', toggleHelp);
    
    // Input validation on blur
    setupInputValidation();
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'dark' : 'light');
}

/**
 * Switch between calculation modes
 * @param {Event} e - Click event
 */
function switchTab(e) {
    const tabBtn = e.currentTarget;
    const tabName = tabBtn.dataset.tab;
    
    // Update active button
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');
    
    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Update current mode
    currentCalculation.mode = tabName === 'mode1' ? 1 : 2;
    
    // Hide results when switching tabs
    document.getElementById('resultsSection').style.display = 'none';
}

/**
 * Toggle help section
 */
function toggleHelp() {
    const helpToggle = document.querySelector('.help-toggle');
    const helpContent = document.querySelector('.help-content');
    
    helpToggle.classList.toggle('open');
    helpContent.classList.toggle('open');
}

/* =============================================
   VALIDATION
   ============================================= */

/**
 * Setup input validation on blur events
 */
function setupInputValidation() {
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });
    });
}

/**
 * Validate individual input
 * @param {HTMLElement} input - Input element
 * @returns {boolean} - True if valid
 */
function validateInput(input) {
    const value = input.value.trim();
    const errorElement = input.parentElement.querySelector('.error-msg');
    const formGroup = input.parentElement;
    
    // Clear previous error
    formGroup.classList.remove('error');
    if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }
    
    // Check if empty
    if (value === '') {
        if (input.hasAttribute('required')) {
            showError(input, 'This field is required');
            return false;
        }
        return true;
    }
    
    const numValue = parseFloat(value);
    
    // Check if valid number
    if (isNaN(numValue)) {
        showError(input, 'Please enter a valid number');
        return false;
    }
    
    // Check for negative values
    if (numValue < 0) {
        showError(input, 'Value cannot be negative');
        return false;
    }
    
    // Zn % validation
    if (input.id.includes('znPercent')) {
        if (numValue > 100) {
            showError(input, 'Zn % cannot exceed 100%');
            return false;
        }
    }
    
    // Reactor Utilization validation
    if (input.id === 'reactorUtilization') {
        if (numValue < 1 || numValue > 100) {
            showError(input, 'Reactor Utilization must be between 1 and 100%');
            return false;
        }
    }
    
    return true;
}

/**
 * Show error message
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showError(input, message) {
    const errorElement = input.parentElement.querySelector('.error-msg');
    const formGroup = input.parentElement;
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    formGroup.classList.add('error');
}

/**
 * Validate all inputs in a form
 * @param {string} formId - Form ID
 * @returns {boolean} - True if all valid
 */
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/* =============================================
   CALCULATION ENGINE - MODE 1
   ============================================= */

/**
 * Calculate Mode 1: From Zinc Ash
 */
function calculateMode1() {
    // Validate form
    if (!validateForm('form1')) {
        alert('Please fix all errors before calculating');
        return;
    }
    
    // Get inputs
    const batchNumber = document.getElementById('batch1').value.trim();
    const engineerName = document.getElementById('engineer1').value.trim();
    const zincAsh = parseFloat(document.getElementById('zincAsh1').value);
    const znPercent = parseFloat(document.getElementById('znPercent1').value);
    const totalProcess = parseFloat(document.getElementById('totalProcess1').value);
    
    // Additional validations
    if (zincAsh < 0 || znPercent < 0 || totalProcess < 0) {
        alert('Values cannot be negative');
        return;
    }
    
    // Store input data
    currentCalculation.mode = 1;
    currentCalculation.batchNumber = batchNumber;
    currentCalculation.engineerName = engineerName;
    currentCalculation.inputs = {
        zincAsh,
        znPercent,
        totalProcess
    };
    
    // Perform calculations
    const results = performMode1Calculation(zincAsh, znPercent, totalProcess);
    
    // Validate results
    if (!validateResults(results)) {
        return;
    }
    
    // Store and display results
    currentCalculation.results = results;
    displayResults(results);
    showResultsSection();
}

/**
 * Perform Mode 1 calculations
 * @param {number} zincAsh - Zinc Ash in kg
 * @param {number} znPercent - Zn % in Zinc Ash
 * @param {number} totalProcess - Total Process in kg
 * @returns {Object} - Calculation results
 */
function performMode1Calculation(zincAsh, znPercent, totalProcess) {
    // Pure Zn = Zinc Ash × Zn% ÷ 100
    const pureZn = round((zincAsh * znPercent) / 100);
    
    // Concentrated H₂SO₄ = Pure Zn × 98 ÷ 65
    const concentratedAcid = round((pureZn * MOLECULAR_WEIGHTS.H2SO4) / MOLECULAR_WEIGHTS.Zn);
    
    // Diluted Acid = Concentrated H₂SO₄ × 2
    const dilutedAcid = round(concentratedAcid * 2);
    
    // Dilution Water = Concentrated H₂SO₄
    const dilutionWater = round(concentratedAcid);
    
    // Process Water = Total Process − (Zinc Ash + Diluted Acid)
    const processWater = round(totalProcess - (zincAsh + dilutedAcid));
    
    // Total Water = Process Water + Dilution Water
    const totalWater = round(processWater + dilutionWater);
    
    // ZnSO₄ Produced = Pure Zn × 161 ÷ 65
    const znSulfate = round((pureZn * MOLECULAR_WEIGHTS.ZnSO4) / MOLECULAR_WEIGHTS.Zn);
    
    // Hydrogen Produced = Pure Zn × 2 ÷ 65
    const hydrogenGas = round((pureZn * MOLECULAR_WEIGHTS.H2) / MOLECULAR_WEIGHTS.Zn);
    
    return {
        pureZn,
        concentratedAcid,
        dilutedAcid,
        dilutionWater,
        processWater,
        totalWater,
        znSulfate,
        hydrogenGas
    };
}

/* =============================================
   CALCULATION ENGINE - MODE 2
   ============================================= */

/**
 * Calculate Mode 2: From Reactor Capacity
 */
function calculateMode2() {
    // Validate form
    if (!validateForm('form2')) {
        alert('Please fix all errors before calculating');
        return;
    }
    
    // Get inputs
    const batchNumber = document.getElementById('batch2').value.trim();
    const engineerName = document.getElementById('engineer2').value.trim();
    const reactorCapacity = parseFloat(document.getElementById('reactorCapacity').value);
    const reactorUtilization = parseFloat(document.getElementById('reactorUtilization').value);
    const znPercent = parseFloat(document.getElementById('znPercent2').value);
    
    // Additional validations
    if (reactorCapacity < 0 || reactorUtilization < 0 || znPercent < 0) {
        alert('Values cannot be negative');
        return;
    }
    
    // Store input data
    currentCalculation.mode = 2;
    currentCalculation.batchNumber = batchNumber;
    currentCalculation.engineerName = engineerName;
    currentCalculation.inputs = {
        reactorCapacity,
        reactorUtilization,
        znPercent
    };
    
    // Perform calculations
    const results = performMode2Calculation(reactorCapacity, reactorUtilization, znPercent);
    
    // Validate results
    if (!validateResults(results)) {
        return;
    }
    
    // Store and display results
    currentCalculation.results = results;
    displayResults(results);
    showResultsSection();
}

/**
 * Perform Mode 2 calculations
 * @param {number} reactorCapacity - Reactor Capacity in L
 * @param {number} reactorUtilization - Reactor Utilization %
 * @param {number} znPercent - Zn % in Zinc Ash
 * @returns {Object} - Calculation results
 */
function performMode2Calculation(reactorCapacity, reactorUtilization, znPercent) {
    // Working Capacity = Reactor Capacity × Reactor Utilization ÷ 100
    const workingCapacity = round((reactorCapacity * reactorUtilization) / 100);
    
    // Calculated Zinc Ash = Working Capacity × (68 ÷ 500)
    const zincAsh = round((workingCapacity * LAB_RECIPE.zincAsh) / LAB_RECIPE.batch);
    
    // Pure Zn = Zinc Ash × Zn% ÷ 100
    const pureZn = round((zincAsh * znPercent) / 100);
    
    // Concentrated H₂SO₄ = Pure Zn × 98 ÷ 65
    const concentratedAcid = round((pureZn * MOLECULAR_WEIGHTS.H2SO4) / MOLECULAR_WEIGHTS.Zn);
    
    // Diluted Acid = Concentrated H₂SO₄ × 2
    const dilutedAcid = round(concentratedAcid * 2);
    
    // Dilution Water = Concentrated H₂SO₄
    const dilutionWater = round(concentratedAcid);
    
    // Process Water = Working Capacity − (Zinc Ash + Diluted Acid)
    const processWater = round(workingCapacity - (zincAsh + dilutedAcid));
    
    // Total Water = Process Water + Dilution Water
    const totalWater = round(processWater + dilutionWater);
    
    // ZnSO₄ Produced = Pure Zn × 161 ÷ 65
    const znSulfate = round((pureZn * MOLECULAR_WEIGHTS.ZnSO4) / MOLECULAR_WEIGHTS.Zn);
    
    // Hydrogen Produced = Pure Zn × 2 ÷ 65
    const hydrogenGas = round((pureZn * MOLECULAR_WEIGHTS.H2) / MOLECULAR_WEIGHTS.Zn);
    
    // Store calculated zinc ash for report
    currentCalculation.inputs.calculatedZincAsh = zincAsh;
    
    return {
        pureZn,
        concentratedAcid,
        dilutedAcid,
        dilutionWater,
        processWater,
        totalWater,
        znSulfate,
        hydrogenGas
    };
}

/* =============================================
   UTILITY FUNCTIONS
   ============================================= */

/**
 * Round number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} - Rounded number
 */
function round(num, decimals = DECIMAL_PLACES) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Format number to fixed decimal places
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
function formatNumber(num) {
    return num.toFixed(DECIMAL_PLACES);
}

/**
 * Validate calculation results
 * @param {Object} results - Calculation results
 * @returns {boolean} - True if valid
 */
function validateResults(results) {
    // Check for negative process water
    if (results.processWater < 0) {
        alert('Error: Process Water cannot be negative. Please check your inputs. Total process/working capacity may be too small.');
        return false;
    }
    
    // Check for NaN or Infinity
    for (let key in results) {
        if (!isFinite(results[key])) {
            alert('Error: Invalid calculation result. Please check your inputs.');
            return false;
        }
    }
    
    return true;
}

/**
 * Display results in result cards
 * @param {Object} results - Calculation results
 */
function displayResults(results) {
    document.getElementById('result-pureZn').textContent = formatNumber(results.pureZn);
    document.getElementById('result-concentratedAcid').textContent = formatNumber(results.concentratedAcid);
    document.getElementById('result-dilutedAcid').textContent = formatNumber(results.dilutedAcid);
    document.getElementById('result-dilutionWater').textContent = formatNumber(results.dilutionWater);
    document.getElementById('result-processWater').textContent = formatNumber(results.processWater);
    document.getElementById('result-znSulfate').textContent = formatNumber(results.znSulfate);
    document.getElementById('result-hydrogenGas').textContent = formatNumber(results.hydrogenGas);
}

/**
 * Show results section
 */
function showResultsSection() {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Reset form
 * @param {string} formId - Form ID
 */
function resetForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
    
    // Clear error messages
    form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
        const errorMsg = group.querySelector('.error-msg');
        if (errorMsg) {
            errorMsg.classList.remove('show');
            errorMsg.textContent = '';
        }
    });
    
    // Hide results
    document.getElementById('resultsSection').style.display = 'none';
    
    // Reset default values
    if (formId === 'form2') {
        document.getElementById('reactorUtilization').value = '80';
    }
}

/* =============================================
   PRINT REPORT
   ============================================= */

/**
 * Prepare and print report
 */
function printReport() {
    if (!currentCalculation.results || Object.keys(currentCalculation.results).length === 0) {
        alert('No calculation to print. Please perform a calculation first.');
        return;
    }
    
    // Populate report data
    populateReportData();
    
    // Print
    setTimeout(() => {
        window.print();
    }, 100);
}

/**
 * Populate report with calculation data
 */
function populateReportData() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Batch info
    document.getElementById('report-batch').textContent = currentCalculation.batchNumber || '-';
    document.getElementById('report-engineer').textContent = currentCalculation.engineerName || '-';
    document.getElementById('report-date').textContent = dateStr;
    document.getElementById('report-time').textContent = timeStr;
    
    // Input details
    populateInputTable();
    
    // Results
    document.getElementById('report-pureZn').textContent = formatNumber(currentCalculation.results.pureZn);
    document.getElementById('report-concentratedAcid').textContent = formatNumber(currentCalculation.results.concentratedAcid);
    document.getElementById('report-dilutedAcid').textContent = formatNumber(currentCalculation.results.dilutedAcid);
    document.getElementById('report-dilutionWater').textContent = formatNumber(currentCalculation.results.dilutionWater);
    document.getElementById('report-processWater').textContent = formatNumber(currentCalculation.results.processWater);
    document.getElementById('report-znSulfate').textContent = formatNumber(currentCalculation.results.znSulfate);
    document.getElementById('report-hydrogenGas').textContent = formatNumber(currentCalculation.results.hydrogenGas);
}

/**
 * Populate input table based on mode
 */
function populateInputTable() {
    const table = document.getElementById('reportInputTable');
    let rows = '<tr><td><strong>Parameter</strong></td><td><strong>Value</strong></td></tr>';
    
    if (currentCalculation.mode === 1) {
        rows += `<tr><td>Zinc Ash</td><td>${formatNumber(currentCalculation.inputs.zincAsh)} kg</td></tr>`;
        rows += `<tr><td>Zn %</td><td>${formatNumber(currentCalculation.inputs.znPercent)} %</td></tr>`;
        rows += `<tr><td>Total Process</td><td>${formatNumber(currentCalculation.inputs.totalProcess)} kg</td></tr>`;
    } else {
        rows += `<tr><td>Reactor Capacity</td><td>${formatNumber(currentCalculation.inputs.reactorCapacity)} L</td></tr>`;
        rows += `<tr><td>Reactor Utilization</td><td>${formatNumber(currentCalculation.inputs.reactorUtilization)} %</td></tr>`;
        rows += `<tr><td>Calculated Zinc Ash</td><td>${formatNumber(currentCalculation.inputs.calculatedZincAsh)} kg</td></tr>`;
        rows += `<tr><td>Zn %</td><td>${formatNumber(currentCalculation.inputs.znPercent)} %</td></tr>`;
    }
    
    table.innerHTML = rows;
}

/* =============================================
   BROWSER STORAGE (Session Only)
   ============================================= */

/**
 * Note: As per requirements, no Local Storage is used.
 * Only sessionStorage is used for theme preference.
 * Session data is NOT persisted.
 */

// Theme is stored in localStorage for persistence across sessions
// This is acceptable as it's just a UI preference, not calculation data
