// Logseqy - Content Script

let selectionPopup = null;
let overlay = null;
let isOverlayVisible = false;
let captureFormats = [];

// Lucide SVG Icons (https://lucide.dev/)
const ICONS = {
  todo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  quote: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
  note: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>',
  code: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
  link: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  checkSquare: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
  square: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>',
  close: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  page: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
  time: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  layers: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.97 4.08a2 2 0 0 1-1.66 0L2.5 12.5"/><path d="m22 17.5-8.97 4.08a2 2 0 0 1-1.66 0L2.5 17.5"/></svg>',
  chevronLeft: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  sun: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  graph: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6 12h4"/><path d="M14 12h4"/><path d="M12 6v4"/><path d="M12 14v4"/></svg>',
};

// Get icon HTML
function getIcon(name, size = 16) {
  const svg = ICONS[name] || ICONS.note;
  return `<span class="lh-icon" style="width:${size}px;height:${size}px">${svg}</span>`;
}

// Initialize
init();

async function init() {
  // Load settings
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  captureFormats = settings.captureFormats || [];
  
  // Set up text selection listener
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleOverlay') {
      toggleOverlay();
      sendResponse({ success: true });
    }
    return true;
  });
  
  // Close popup when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (selectionPopup && !selectionPopup.contains(e.target)) {
      hideSelectionPopup();
    }
  });
  
  // Highlight captured text on page load
  setTimeout(loadAndHighlightCapturedText, 1000);
}

// Load captured blocks and highlight them on page load
async function loadAndHighlightCapturedText() {
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'getCapturedBlocks',
      url: window.location.href
    });
    
    if (result.success && result.blocks && result.blocks.length > 0) {
      highlightCapturedText(result.blocks);
    }
  } catch (error) {
    console.log('Logseqy: Could not load highlights', error);
  }
}

// Generate highlight URL (text fragment)
function generateHighlightUrl(selectedText) {
  const encoded = encodeURIComponent(selectedText.trim().substring(0, 100));
  return `${window.location.href.split('#')[0]}#:~:text=${encoded}`;
}

// Handle text selection
function handleTextSelection(e) {
  // Don't show popup when overlay is open
  if (isOverlayVisible) {
    return;
  }
  
  // Small delay to ensure selection is complete
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0 && selectedText.length < 5000) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showSelectionPopup(selectedText, rect);
    } else {
      hideSelectionPopup();
    }
  }, 10);
}

// Show selection popup
async function showSelectionPopup(selectedText, rect) {
  // Don't show popup when overlay is open
  if (isOverlayVisible) return;
  
  // Refresh settings
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  captureFormats = settings.captureFormats || [];
  
  hideSelectionPopup();
  
  // Filter out quote format and only show enabled formats
  const enabledFormats = captureFormats.filter(f => f.enabled && f.id !== 'quote');
  if (enabledFormats.length === 0) return;
  
  selectionPopup = document.createElement('div');
  selectionPopup.className = 'logseq-helper-popup';
  selectionPopup.innerHTML = `
    <div class="lh-popup-content">
      <div class="lh-popup-header">
        <span class="lh-popup-title">Capture to Logseq</span>
      </div>
      <div class="lh-popup-actions">
        ${enabledFormats.map(format => `
          <button class="lh-popup-btn" data-format-id="${format.id}" title="${format.name}">
            <span class="lh-btn-icon">${getIcon(format.icon, 14)}</span>
            <span class="lh-btn-text">${format.name}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
  
  // Position popup
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  let top = rect.bottom + scrollY + 8;
  let left = rect.left + scrollX + (rect.width / 2);
  
  // Adjust if popup goes off screen
  const popupWidth = 200;
  if (left + popupWidth / 2 > window.innerWidth + scrollX) {
    left = window.innerWidth + scrollX - popupWidth / 2 - 16;
  }
  if (left - popupWidth / 2 < scrollX) {
    left = scrollX + popupWidth / 2 + 16;
  }
  
  selectionPopup.style.top = `${top}px`;
  selectionPopup.style.left = `${left}px`;
  
  document.body.appendChild(selectionPopup);
  
  // Add click handlers
  selectionPopup.querySelectorAll('.lh-popup-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const formatId = btn.dataset.formatId;
      const format = captureFormats.find(f => f.id === formatId);
      
      if (format) {
        await captureText(selectedText, format.format, formatId);
      }
    });
  });
}

// Hide selection popup
function hideSelectionPopup() {
  if (selectionPopup) {
    selectionPopup.remove();
    selectionPopup = null;
  }
}

// Capture text to Logseq
async function captureText(content, format, formatId) {
  // If it's a TODO, show date picker first
  if (formatId === 'todo') {
    showDatePicker(content, format);
    return;
  }
  
  await performCapture(content, format);
}

// Show date picker for TODO deadline
function showDatePicker(content, format) {
  hideSelectionPopup();
  
  const datePicker = document.createElement('div');
  datePicker.className = 'lh-date-picker';
  datePicker.id = 'lh-date-picker';
  
  // Generate calendar for current month
  const today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  
  datePicker.innerHTML = generateDatePickerHTML(currentYear, currentMonth, today);
  
  document.body.appendChild(datePicker);
  
  // Animate in
  setTimeout(() => datePicker.classList.add('lh-date-picker-show'), 10);
  
  // Event handlers
  datePicker.querySelector('.lh-dp-prev').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateCalendar(currentYear, currentMonth, today);
  });
  
  datePicker.querySelector('.lh-dp-next').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateCalendar(currentYear, currentMonth, today);
  });
  
  // Skip button (no deadline)
  datePicker.querySelector('.lh-dp-skip').addEventListener('click', async () => {
    hideDatePicker();
    await performCapture(content, format);
  });
  
  // Cancel button
  datePicker.querySelector('.lh-dp-cancel').addEventListener('click', () => {
    hideDatePicker();
  });
  
  // Date selection
  datePicker.addEventListener('click', async (e) => {
    if (e.target.classList.contains('lh-dp-day') && !e.target.classList.contains('lh-dp-day-disabled')) {
      const day = parseInt(e.target.dataset.day);
      const selectedDate = new Date(currentYear, currentMonth, day);
      
      // Format deadline for Logseq: DEADLINE: <2025-12-03 Wed>
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const dayName = days[selectedDate.getDay()];
      const deadline = `DEADLINE: <${dateStr} ${dayName}>`;
      
      // Modify format to include deadline
      const formatWithDeadline = format.replace('TODO {{content}}', `TODO {{content}}\n${deadline}`);
      
      hideDatePicker();
      await performCapture(content, formatWithDeadline);
    }
  });
  
  // Close on outside click
  datePicker.querySelector('.lh-dp-backdrop').addEventListener('click', () => {
    hideDatePicker();
  });
}

function generateDatePickerHTML(year, month, today) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  let daysHTML = '';
  
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    daysHTML += '<span class="lh-dp-day lh-dp-day-empty"></span>';
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    daysHTML += `<span class="lh-dp-day ${isToday ? 'lh-dp-day-today' : ''} ${isPast ? 'lh-dp-day-disabled' : ''}" data-day="${day}">${day}</span>`;
  }
  
  return `
    <div class="lh-dp-backdrop"></div>
    <div class="lh-dp-container">
      <div class="lh-dp-header">
        <span class="lh-dp-title">${getIcon('calendar', 18)} Set Deadline</span>
        <button class="lh-dp-close lh-dp-cancel">${getIcon('close', 16)}</button>
      </div>
      <div class="lh-dp-nav">
        <button class="lh-dp-prev">${getIcon('chevronLeft', 18)}</button>
        <span class="lh-dp-month">${months[month]} ${year}</span>
        <button class="lh-dp-next">${getIcon('chevronRight', 18)}</button>
      </div>
      <div class="lh-dp-weekdays">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>
      <div class="lh-dp-days">
        ${daysHTML}
      </div>
      <div class="lh-dp-actions">
        <button class="lh-dp-skip">No Deadline</button>
      </div>
    </div>
  `;
}

function updateCalendar(year, month, today) {
  const picker = document.getElementById('lh-date-picker');
  if (!picker) return;
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  let daysHTML = '';
  
  for (let i = 0; i < firstDay; i++) {
    daysHTML += '<span class="lh-dp-day lh-dp-day-empty"></span>';
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    daysHTML += `<span class="lh-dp-day ${isToday ? 'lh-dp-day-today' : ''} ${isPast ? 'lh-dp-day-disabled' : ''}" data-day="${day}">${day}</span>`;
  }
  
  picker.querySelector('.lh-dp-month').textContent = `${months[month]} ${year}`;
  picker.querySelector('.lh-dp-days').innerHTML = daysHTML;
}

function hideDatePicker() {
  const picker = document.getElementById('lh-date-picker');
  if (picker) {
    picker.classList.remove('lh-date-picker-show');
    setTimeout(() => picker.remove(), 200);
  }
}

// Perform the actual capture
async function performCapture(content, format) {
  const highlightUrl = generateHighlightUrl(content);
  
  // Show capturing state
  showNotification('Capturing...', 'info');
  
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'captureToLogseq',
      data: {
        content,
        format,
        pageUrl: window.location.href,
        pageTitle: document.title,
        highlightUrl
      }
    });
    
    console.log('Capture result:', result);
    
    if (result.success) {
      showNotification('Captured to Logseq!', 'success');
      hideSelectionPopup();
      window.getSelection().removeAllRanges();
      
      // Update highlights on page immediately
      setTimeout(loadAndHighlightCapturedText, 500);
      
      // Refresh overlay if visible
      if (isOverlayVisible) {
        await Promise.all([
          loadTodosForOverlay(),
          loadCapturedForOverlay()
        ]);
      }
    } else {
      console.error('Capture failed:', result.error);
      showNotification(`Error: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Capture exception:', error);
    showNotification(`Error: ${error.message}`, 'error');
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Remove any existing notifications
  document.querySelectorAll('.lh-notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `lh-notification lh-notification-${type}`;
  
  let iconName = 'check';
  if (type === 'error') iconName = 'close';
  if (type === 'info') iconName = 'send';
  
  notification.innerHTML = `
    <span class="lh-notification-icon">${getIcon(iconName, 18)}</span>
    <span class="lh-notification-text">${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.classList.add('lh-notification-show'), 10);
  
  // Remove after delay (longer for errors)
  const delay = type === 'error' ? 5000 : 2500;
  setTimeout(() => {
    notification.classList.remove('lh-notification-show');
    setTimeout(() => notification.remove(), 300);
  }, delay);
}

// Toggle overlay
async function toggleOverlay() {
  if (isOverlayVisible) {
    hideOverlay();
  } else {
    await showOverlay();
  }
}

// Show overlay
async function showOverlay() {
  hideOverlay();
  
  const domain = new URL(window.location.href).hostname;
  
  overlay = document.createElement('div');
  overlay.className = 'logseq-helper-overlay';
  overlay.innerHTML = `
    <div class="lh-overlay-backdrop"></div>
    <div class="lh-overlay-panel">
      <div class="lh-overlay-header">
        <div class="lh-overlay-title">
          ${getIcon('graph', 24)}
          <span>Logseqy</span>
        </div>
        <div class="lh-header-actions">
          <button class="lh-theme-toggle" id="lh-theme-toggle" title="Toggle theme">
            <span class="lh-theme-icon-dark">${getIcon('sun', 18)}</span>
            <span class="lh-theme-icon-light">${getIcon('moon', 18)}</span>
          </button>
          <button class="lh-overlay-close" title="Close (Ctrl+Shift+L)">
            ${getIcon('close', 20)}
          </button>
        </div>
      </div>
      
      <div class="lh-overlay-content">
        <!-- Section 1: TODOs from this page -->
        <div class="lh-section">
          <div class="lh-section-header">
            ${getIcon('todo', 16)}
            <span class="lh-section-title">Tasks</span>
          </div>
          <div class="lh-section-content" id="lh-todos-container">
            <div class="lh-loading">
              <div class="lh-loading-spinner"></div>
              <span>Loading...</span>
            </div>
          </div>
        </div>
        
        <!-- Section 2: Captured from this page -->
        <div class="lh-section">
          <div class="lh-section-header">
            ${getIcon('clipboard', 16)}
            <span class="lh-section-title">Captured from this page</span>
          </div>
          <div class="lh-section-content lh-blocks-container" id="lh-blocks-container">
            <div class="lh-loading">
              <div class="lh-loading-spinner"></div>
              <span>Loading...</span>
            </div>
          </div>
        </div>
        
        <!-- Section 3: Related from domain -->
        <div class="lh-section">
          <div class="lh-section-header">
            ${getIcon('link', 16)}
            <span class="lh-section-title">Related captured from ${domain}</span>
          </div>
          <div class="lh-section-content lh-blocks-container" id="lh-related-container">
            <div class="lh-loading">
              <div class="lh-loading-spinner"></div>
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  isOverlayVisible = true;
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  
  // Add event listeners
  overlay.querySelector('.lh-overlay-close').addEventListener('click', hideOverlay);
  overlay.querySelector('.lh-overlay-backdrop').addEventListener('click', hideOverlay);
  
  // Theme toggle
  overlay.querySelector('#lh-theme-toggle').addEventListener('click', toggleTheme);
  
  // Load saved theme
  const savedTheme = localStorage.getItem('lh-theme') || 'dark';
  if (savedTheme === 'light') {
    overlay.querySelector('.lh-overlay-panel').classList.add('lh-light-theme');
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleOverlayKeydown);
  
  // Animate in
  setTimeout(() => overlay.classList.add('lh-overlay-show'), 10);
  
  // Load all sections - query Logseq when modal opens
  await Promise.all([
    loadTodosForOverlay(),
    loadCapturedForOverlay(),
    loadRelatedForOverlay()
  ]);
}

// Handle overlay keyboard shortcuts
function handleOverlayKeydown(e) {
  if (e.key === 'Escape') {
    hideOverlay();
  }
}

// Toggle light/dark theme
function toggleTheme() {
  const panel = overlay.querySelector('.lh-overlay-panel');
  const isLight = panel.classList.toggle('lh-light-theme');
  localStorage.setItem('lh-theme', isLight ? 'light' : 'dark');
}

// Hide overlay
function hideOverlay() {
  if (overlay) {
    document.removeEventListener('keydown', handleOverlayKeydown);
    overlay.classList.remove('lh-overlay-show');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
    }, 300);
  }
  isOverlayVisible = false;
  // Keep highlights visible after closing overlay
}

// Load TODOs for overlay
async function loadTodosForOverlay() {
  const container = document.getElementById('lh-todos-container');
  const section = container?.closest('.lh-section');
  if (!container) return;
  
  // Query Logseq for blocks with #quick-capture and source:: matching this URL
  console.log('Loading TODOs for URL:', window.location.href);
  const result = await chrome.runtime.sendMessage({
    action: 'getCapturedBlocks',
    url: window.location.href
  });
  console.log('TODOs query result:', result);
  
  if (!result.success) {
    // Hide the entire section on error
    if (section) section.style.display = 'none';
    return;
  }
  
  const allBlocks = result.blocks || [];
  
  // Filter only TODO blocks (case-insensitive, can be anywhere in content)
  const todos = allBlocks.filter(block => {
    const content = block.content || '';
    return content.match(/\b(TODO|DOING|NOW|LATER|DONE|WAITING)\b/i);
  });
  
  if (todos.length === 0) {
    // Hide the entire tasks section if no tasks
    if (section) section.style.display = 'none';
    return;
  }
  
  container.innerHTML = todos.map((block, index) => {
    const content = block.content || '';
    const isDone = content.match(/\bDONE\b/i);
    // Extract TODO text, removing status marker and #quick-capture tag
    let todoText = content
      .replace(/\b(TODO|DOING|NOW|LATER|DONE|WAITING)\b/i, '')
      .split('\n')[0]
      .replace(/#quick-capture/g, '')
      .trim();
    
    return `
      <div class="lh-todo-item ${isDone ? 'lh-todo-done' : ''}" style="animation-delay: ${index * 30}ms">
        <span class="lh-todo-checkbox">${isDone ? getIcon('checkSquare', 18) : getIcon('square', 18)}</span>
        <span class="lh-todo-text">${escapeHtml(todoText)}</span>
        ${block.logseqUrl ? `
          <a href="${block.logseqUrl}" class="lh-todo-link" title="Open in Logseq">
            ${getIcon('link', 16)}
          </a>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Load captured blocks for overlay
async function loadCapturedForOverlay() {
  const container = document.getElementById('lh-blocks-container');
  if (!container) return;
  
  // Query Logseq for blocks with #quick-capture and source:: matching this URL
  console.log('Loading captured blocks for URL:', window.location.href);
  const result = await chrome.runtime.sendMessage({
    action: 'getCapturedBlocks',
    url: window.location.href
  });
  console.log('Captured blocks query result:', result);
  
  if (!result.success) {
    container.innerHTML = `
      <div class="lh-empty-state-small">
        ${getIcon('clipboard', 24)}
        <span class="lh-empty-text-small">Error: ${result.error || 'Could not query Logseq'}</span>
      </div>
    `;
    return;
  }
  
  const allBlocks = result.blocks || [];
  
  // Filter out TODO blocks (they're shown in the TODOs section)
  const blocks = allBlocks.filter(block => {
    const content = block.content || '';
    return !content.match(/\b(TODO|DOING|NOW|LATER|DONE|WAITING)\b/i);
  });
  
  if (blocks.length === 0) {
    container.innerHTML = `
      <div class="lh-empty-state-small">
        ${getIcon('clipboard', 24)}
        <span class="lh-empty-text-small">No content captured yet. Select text to capture!</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = blocks.map((block, index) => `
    <div class="lh-block-item" style="animation-delay: ${index * 50}ms">
      <div class="lh-block-content">
        ${renderMarkdown(stripSource(block.content || block['block/content'] || ''))}
      </div>
      ${block.logseqUrl ? `
        <a href="${block.logseqUrl}" class="lh-block-link" title="Open in Logseq">
          ${getIcon('link', 12)} open in logseq
        </a>
      ` : ''}
    </div>
  `).join('');
  
  // Highlight captured text on the page
  highlightCapturedText(allBlocks);
}

// Highlight captured text on the page
function highlightCapturedText(blocks) {
  // Remove existing highlights first
  removeAllHighlights();
  
  const textsToHighlight = [];
  
  blocks.forEach(block => {
    const content = block.content || '';
    // Extract the actual captured text (remove TODO/markers, tags, source line)
    let capturedText = content
      .replace(/^(TODO|DOING|NOW|LATER|DONE|WAITING)\s*/i, '')
      .replace(/#quick-capture/g, '')
      .split('\n')
      .filter(line => !line.trim().startsWith('source::'))
      .join(' ')
      .replace(/^>\s*/, '') // Remove quote marker
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .trim();
    
    if (capturedText.length > 5) {
      textsToHighlight.push(capturedText);
    }
  });
  
  if (textsToHighlight.length > 0) {
    highlightTextsOnPage(textsToHighlight);
  }
}

// Remove all highlights
function removeAllHighlights() {
  document.querySelectorAll('.lh-captured-highlight').forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    }
  });
}

// Find and highlight multiple texts on the page using CSS highlight or mark
function highlightTextsOnPage(textsToHighlight) {
  // Use window.find or manual DOM search
  textsToHighlight.forEach(searchText => {
    const normalizedSearch = searchText.toLowerCase().trim();
    if (normalizedSearch.length < 5) return;
    
    // Try to find and highlight using Range API
    findAndHighlightText(normalizedSearch);
  });
}

// Find text in page and highlight it
function findAndHighlightText(searchText) {
  const bodyText = document.body.innerText.toLowerCase();
  
  // Check if the text exists on the page
  if (!bodyText.includes(searchText.substring(0, 50).toLowerCase())) {
    return;
  }
  
  // Walk through all text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip our UI, scripts, styles
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.logseq-helper-overlay, .lh-selection-popup, .lh-notification, .lh-date-picker, script, style, noscript, iframe')) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.classList.contains('lh-captured-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }
  
  // Get first few words to search (more likely to match)
  const words = searchText.split(/\s+/);
  const searchPhrases = [];
  
  // Add progressively smaller phrases
  if (words.length >= 5) {
    searchPhrases.push(words.slice(0, 5).join(' '));
  }
  if (words.length >= 3) {
    searchPhrases.push(words.slice(0, 3).join(' '));
  }
  
  // Also add the full text if it's not too long
  if (searchText.length <= 100) {
    searchPhrases.unshift(searchText);
  }
  
  for (const phrase of searchPhrases) {
    const lowerPhrase = phrase.toLowerCase();
    if (lowerPhrase.length < 5) continue;
    
    for (const node of textNodes) {
      const nodeText = node.textContent;
      const lowerNodeText = nodeText.toLowerCase();
      
      const index = lowerNodeText.indexOf(lowerPhrase);
      if (index !== -1) {
        // Found a match - highlight this node
        try {
          const span = document.createElement('span');
          span.className = 'lh-captured-highlight';
          
          // If the match is partial, we highlight the whole node for simplicity
          span.textContent = nodeText;
          
          if (node.parentNode) {
            node.parentNode.replaceChild(span, node);
          }
          return; // Found and highlighted, move to next search text
        } catch (e) {
          console.log('Highlight error:', e);
        }
      }
    }
  }
}

// Load related blocks from the same domain
async function loadRelatedForOverlay() {
  const container = document.getElementById('lh-related-container');
  if (!container) return;
  
  const result = await chrome.runtime.sendMessage({
    action: 'getRelatedBlocks',
    url: window.location.href
  });
  
  if (!result.success) {
    container.innerHTML = `
      <div class="lh-empty-state-small">
        ${getIcon('link', 24)}
        <span class="lh-empty-text-small">Could not load related content</span>
      </div>
    `;
    return;
  }
  
  // Filter out blocks from the current page (already shown in "Captured" section)
  // Use exact URL match - if the content contains the current URL, exclude it
  const currentUrl = window.location.href;
  
  const blocks = (result.blocks || []).filter(block => {
    const content = block.content || '';
    // Exclude if this block's source contains the exact current URL
    return !content.includes(currentUrl);
  });
  
  if (blocks.length === 0) {
    container.innerHTML = `
      <div class="lh-empty-state-small">
        ${getIcon('link', 24)}
        <span class="lh-empty-text-small">No other captures from this site</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = blocks.map((block, index) => `
    <div class="lh-block-item" style="animation-delay: ${index * 50}ms">
      <div class="lh-block-content">
        ${renderMarkdown(stripSource(block.content || ''))}
      </div>
      ${block.logseqUrl ? `
        <a href="${block.logseqUrl}" class="lh-block-link" title="Open in Logseq">
          ${getIcon('link', 12)} open in logseq
        </a>
      ` : ''}
    </div>
  `).join('');
}

// Utility functions

// Strip source:: line and #quick-capture from content for display
function stripSource(content) {
  return content
    .split('\n')
    .filter(line => !line.trim().startsWith('source::'))
    .join('\n')
    .replace(/#quick-capture/g, '')
    .trim();
}

function truncateUrl(url) {
  const maxLength = 50;
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
}

// Render markdown to HTML using marked.js
function renderMarkdown(text) {
  if (!text) return '';
  
  try {
    // Check if marked is available
    if (typeof marked !== 'undefined') {
      // Configure marked for safe rendering
      marked.setOptions({
        breaks: true,      // Convert \n to <br>
        gfm: true,         // GitHub Flavored Markdown
      });
      
      // Convert Logseq-specific syntax to markdown
      let processedText = text
        // Convert Logseq TODO/DONE markers
        .replace(/^(TODO|DOING|NOW|LATER|DONE|WAITING|CANCELLED)\s/gm, (match, status) => {
          const icons = {
            'TODO': '☐ ',
            'DOING': '🔄 ',
            'NOW': '⚡ ',
            'LATER': '📅 ',
            'DONE': '☑️ ',
            'WAITING': '⏳ ',
            'CANCELLED': '❌ '
          };
          return icons[status] || match;
        })
        // Convert Logseq properties (key:: value) to styled format
        .replace(/^(\s*)([a-zA-Z-]+)::\s*(.*)$/gm, '$1**$2:** $3')
        // Convert Logseq page links [[Page Name]] to styled text
        .replace(/\[\[([^\]]+)\]\]/g, '`[[$1]]`')
        // Convert Logseq block references ((uuid)) to styled text
        .replace(/\(\(([^)]+)\)\)/g, '`(($1))`');
      
      return marked.parse(processedText);
    } else {
      // Fallback: basic escaping if marked isn't available
      return escapeHtml(text).replace(/\n/g, '<br>');
    }
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return escapeHtml(text).replace(/\n/g, '<br>');
  }
}
