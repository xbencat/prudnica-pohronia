// Device detection and URL configuration
const SPREADSHEET_URLS = {
    mobile: 'https://docs.google.com/spreadsheets/d/1q4HsXc0OKLhAeRYTCNKtb8Hw2DS6jNTBOPQ4T1i6We4/preview?usp=sharing&widget=true&headers=false&chrome=false&rm=minimal&single=true',
    desktop: 'https://docs.google.com/spreadsheets/d/1dJyo99Fi5mfcR82oTpaWIq8vuCE9AX9I863XDF2Ffjg/preview?usp=sharing&widget=true&headers=false&chrome=false&rm=minimal&single=true'
};

const iframe = document.getElementById('scoreboard-iframe');
let isLoading = false;
let currentDeviceType = null;

/**
 * QR Code Dropdown functionality
 */
const qrToggle = document.getElementById('qr-toggle');
const qrContent = document.getElementById('qr-content');

if (qrToggle && qrContent) {
    qrToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        qrContent.classList.toggle('show');
        qrToggle.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.qr-dropdown')) {
            qrContent.classList.remove('show');
            qrToggle.classList.remove('active');
        }
    });
}

/**
 * Detects if the current device is mobile based on multiple criteria
 * @returns {boolean} True if mobile device, false if desktop
 */
function isMobileDevice() {
    // Check user agent for mobile patterns
    const userAgent = navigator.userAgent.toLowerCase();
    const mobilePatterns = [
        /android/i,
        /webos/i,
        /iphone/i,
        /ipad/i,
        /ipod/i,
        /blackberry/i,
        /windows phone/i,
        /opera mini/i,
        /mobile/i
    ];

    const isMobileUA = mobilePatterns.some(pattern => pattern.test(userAgent));

    // Check screen width (tablets and phones)
    const isSmallScreen = window.innerWidth <= 768;

    // Check for touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Combine criteria: mobile if UA suggests mobile OR (small screen AND touch)
    return isMobileUA || (isSmallScreen && isTouchDevice);
}

/**
 * Gets the appropriate spreadsheet URL based on device type
 * @returns {string} The appropriate spreadsheet URL
 */
function getSpreadsheetUrl() {
    const deviceType = isMobileDevice() ? 'mobile' : 'desktop';
    return SPREADSHEET_URLS[deviceType];
}

/**
 * Loads the iframe with the appropriate spreadsheet URL
 * @param {boolean} force - Force reload even if device type hasn't changed
 */
function loadSpreadsheet(force = false) {
    const newDeviceType = isMobileDevice() ? 'mobile' : 'desktop';

    // Only reload if device type changed or forced
    if (force || newDeviceType !== currentDeviceType) {
        currentDeviceType = newDeviceType;
        const url = getSpreadsheetUrl();
        iframe.src = url;
        console.log(`Loaded ${newDeviceType} spreadsheet`);
    }
}

/**
 * Silent auto-refresh - preload in background and switch when ready
 */
function refreshScoreboard() {
    if (isLoading) return; // Prevent multiple simultaneous refreshes

    isLoading = true;
    const currentUrl = getSpreadsheetUrl();

    // Create a hidden iframe to preload the new content
    const tempIframe = document.createElement('iframe');
    tempIframe.style.display = 'none';
    tempIframe.src = currentUrl + '&t=' + Date.now();

    // When the new content is loaded, silently switch
    tempIframe.onload = function() {
        // Small delay to ensure content is fully rendered
        setTimeout(() => {
            iframe.src = tempIframe.src;
            document.body.removeChild(tempIframe);
            isLoading = false;
        }, 100);
    };

    // Handle loading errors
    tempIframe.onerror = function() {
        document.body.removeChild(tempIframe);
        isLoading = false;
        console.error('Failed to refresh scoreboard');
    };

    // Add temp iframe to document to start loading
    document.body.appendChild(tempIframe);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSpreadsheet(true);
});

// Handle orientation changes and resize events
window.addEventListener('resize', function() {
    // Debounce resize events
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        loadSpreadsheet();
    }, 250);
});

// Handle orientation change specifically for mobile devices
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        loadSpreadsheet();
    }, 500); // Wait for orientation change to complete
});

// Start auto-refresh every 30 seconds
setInterval(refreshScoreboard, 30000);