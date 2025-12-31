// Logseq Helper - Content Script

let selectionPopup = null;
let overlay = null;
let isOverlayVisible = false;
let captureFormats = [];

// IconPark SVG Icons
const ICONS = {
  todo: '<svg viewBox="0 0 48 48" fill="none"><path d="M42 20v19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h21" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="m16 20 10 8L41 9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  quote: '<svg viewBox="0 0 48 48" fill="none"><path d="M6 9h19v17H12l-6 9V9ZM29 9h13v17h-8l-5 9V9Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
  note: '<svg viewBox="0 0 48 48" fill="none"><path d="M8 44V4h23l9 10.5V44H8Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M31 4v11h9M15 22h9M15 30h18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  code: '<svg viewBox="0 0 48 48" fill="none"><path d="m16 13-11 11 11 11M32 13l11 11-11 11M28 4 21 44" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clipboard: '<svg viewBox="0 0 48 48" fill="none"><path d="M17 6H8a2 2 0 0 0-2 2v34a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M17 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2Z" stroke="currentColor" stroke-width="3"/><path d="M14 24h10M14 32h20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  edit: '<svg viewBox="0 0 48 48" fill="none"><path d="M42 26v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 26.72V34h7.317L42 13.308 34.634 6 14 26.72Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
  calendar: '<svg viewBox="0 0 48 48" fill="none"><rect x="4" y="8" width="40" height="36" rx="2" stroke="currentColor" stroke-width="3"/><path d="M4 20h40M16 4v8M32 4v8M16 30h4M24 30h4M32 30h4M16 36h4M24 36h4M32 36h4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  link: '<svg viewBox="0 0 48 48" fill="none"><path d="M24 12H10a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2V26" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 4h8v8M40 12 26 26" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 48 48" fill="none"><path d="m10 24 10 10 20-20" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  checkSquare: '<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="6" width="36" height="36" rx="3" stroke="currentColor" stroke-width="3"/><path d="m16 24 6 6 12-12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  square: '<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="6" width="36" height="36" rx="3" stroke="currentColor" stroke-width="3"/></svg>',
  close: '<svg viewBox="0 0 48 48" fill="none"><path d="M14 14 34 34M14 34 34 14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowRight: '<svg viewBox="0 0 48 48" fill="none"><path d="M24 8 40 24 24 40M40 24H8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  send: '<svg viewBox="0 0 48 48" fill="none"><path d="M43 5 29 43l-7-15-15-7 36-16Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="m22 28 21-23" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  page: '<svg viewBox="0 0 48 48" fill="none"><path d="M8 44V4h23l9 10.5V44H8Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M31 4v11h9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  time: '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="3"/><path d="M24 12v14l8 8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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
}

// Generate highlight URL (text fragment)
function generateHighlightUrl(selectedText) {
  const encoded = encodeURIComponent(selectedText.trim().substring(0, 100));
  return `${window.location.href.split('#')[0]}#:~:text=${encoded}`;
}

// Handle text selection
function handleTextSelection(e) {
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
  // Refresh settings
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  captureFormats = settings.captureFormats || [];
  
  hideSelectionPopup();
  
  const enabledFormats = captureFormats.filter(f => f.enabled);
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
        <span class="lh-dp-title">${getIcon('calendar', 16)} Set Deadline</span>
        <button class="lh-dp-close lh-dp-cancel">${getIcon('close', 14)}</button>
      </div>
      <div class="lh-dp-nav">
        <button class="lh-dp-prev">‹</button>
        <span class="lh-dp-month">${months[month]} ${year}</span>
        <button class="lh-dp-next">›</button>
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
      showNotification('✓ Captured to Logseq!', 'success');
      hideSelectionPopup();
      window.getSelection().removeAllRanges();
      
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
    <span class="lh-notification-icon">${getIcon(iconName, 16)}</span>
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
  
  overlay = document.createElement('div');
  overlay.className = 'logseq-helper-overlay';
  overlay.innerHTML = `
    <div class="lh-overlay-backdrop"></div>
    <div class="lh-overlay-panel">
      <div class="lh-overlay-header">
        <div class="lh-overlay-title">
          <svg class="lh-overlay-logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>Logseq Helper</span>
        </div>
        <button class="lh-overlay-close" title="Close (Ctrl+Shift+L)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="lh-overlay-content">
        <!-- Section 1: TODOs -->
        <div class="lh-section">
          <div class="lh-section-header">
            <span class="lh-section-icon">${getIcon('todo', 14)}</span>
            <span class="lh-section-title">TODOs</span>
          </div>
          <div class="lh-section-content" id="lh-todos-container">
            <div class="lh-loading">
              <div class="lh-loading-spinner"></div>
            </div>
          </div>
        </div>
        
        <!-- Section 2: User Notes -->
        <div class="lh-section">
          <div class="lh-section-header">
            <span class="lh-section-icon">${getIcon('edit', 14)}</span>
            <span class="lh-section-title">User Notes</span>
          </div>
          <div class="lh-section-content lh-notes-container" id="lh-notes-container">
            <textarea id="lh-user-note" class="lh-note-textarea" placeholder="Type your note here..." rows="3"></textarea>
            <div class="lh-note-actions">
              <button id="lh-insert-note" class="lh-note-btn lh-note-btn-primary">
                ${getIcon('send', 12)}
                Insert
              </button>
            </div>
          </div>
        </div>
        
        <!-- Section 3: Captured -->
        <div class="lh-section">
          <div class="lh-section-header">
            <span class="lh-section-icon">${getIcon('clipboard', 14)}</span>
            <span class="lh-section-title">Captured</span>
          </div>
          <div class="lh-section-content lh-blocks-container" id="lh-blocks-container">
            <div class="lh-loading">
              <div class="lh-loading-spinner"></div>
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
  
  // Insert note button
  overlay.querySelector('#lh-insert-note').addEventListener('click', insertUserNote);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleOverlayKeydown);
  
  // Animate in
  setTimeout(() => overlay.classList.add('lh-overlay-show'), 10);
  
  // Load all sections
  await Promise.all([
    loadTodosForOverlay(),
    loadCapturedForOverlay()
  ]);
}

// Handle overlay keyboard shortcuts
function handleOverlayKeydown(e) {
  if (e.key === 'Escape') {
    hideOverlay();
  }
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
}

// Insert user note to Logseq
async function insertUserNote() {
  const textarea = document.getElementById('lh-user-note');
  const content = textarea.value.trim();
  
  if (!content) {
    showNotification('Please enter a note first', 'error');
    return;
  }
  
  const btn = document.getElementById('lh-insert-note');
  btn.disabled = true;
  btn.innerHTML = '<span>Inserting...</span>';
  
  try {
    const result = await chrome.runtime.sendMessage({
      action: 'captureToLogseq',
      data: {
        content: content,
        format: '{{content}}\n  source:: [{{title}}]({{url}})',
        pageUrl: window.location.href,
        pageTitle: document.title,
        highlightUrl: window.location.href
      }
    });
    
    if (result.success) {
      showNotification('✓ Note inserted to Logseq!', 'success');
      textarea.value = '';
    } else {
      showNotification(`Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showNotification(`Error: ${error.message}`, 'error');
  }
  
  btn.disabled = false;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    Insert to Logseq
  `;
}

// Load TODOs for overlay
async function loadTodosForOverlay() {
  const container = document.getElementById('lh-todos-container');
  if (!container) return;
  
  // Get locally captured blocks for this URL
  const result = await chrome.runtime.sendMessage({
    action: 'getCapturedBlocks',
    url: window.location.href
  });
  const allBlocks = result.blocks || [];
  
  // Filter only TODO blocks
  const todos = allBlocks.filter(block => {
    const content = block.content || '';
    return content.match(/^(TODO|DOING|NOW|LATER|DONE|WAITING)\s/m);
  });
  
  if (todos.length === 0) {
    container.innerHTML = `
      <div class="lh-empty-state-small">
        ${getIcon('todo', 20)}
        <span class="lh-empty-text-small">No TODOs captured from this page</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = todos.map((block, index) => {
    const content = block.content || '';
    const isDone = content.match(/^DONE\s/m);
    const todoText = content.replace(/^(TODO|DOING|NOW|LATER|DONE|WAITING)\s/m, '').split('\n')[0];
    
    return `
      <div class="lh-todo-item ${isDone ? 'lh-todo-done' : ''}" style="animation-delay: ${index * 30}ms">
        <span class="lh-todo-checkbox">${isDone ? getIcon('checkSquare', 16) : getIcon('square', 16)}</span>
        <span class="lh-todo-text">${escapeHtml(todoText)}</span>
        ${block.logseqUrl ? `
          <a href="${block.logseqUrl}" class="lh-todo-link" title="Open in Logseq">
            ${getIcon('link', 14)}
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
  
  // Get locally captured blocks for this URL
  const result = await chrome.runtime.sendMessage({
    action: 'getCapturedBlocks',
    url: window.location.href
  });
  const allBlocks = result.blocks || [];
  
  // Filter out TODO blocks (they're shown in the TODOs section)
  const blocks = allBlocks.filter(block => {
    const content = block.content || '';
    return !content.match(/^(TODO|DOING|NOW|LATER|DONE|WAITING)\s/m);
  });
  
  if (blocks.length === 0) {
    container.innerHTML = `
      <div class="lh-empty-state-small">
        ${getIcon('clipboard', 20)}
        <span class="lh-empty-text-small">No content captured yet. Select text to capture!</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = blocks.map((block, index) => `
    <div class="lh-block-card" style="animation-delay: ${index * 50}ms">
      <div class="lh-block-content">
        ${renderMarkdown(block.content || block['block/content'] || '')}
      </div>
      <div class="lh-block-meta">
        ${block.targetPage || block['block/page']?.['page/original-name'] ? `
          <span class="lh-block-page">
            ${getIcon('page', 12)}
            ${escapeHtml(block.targetPage || block['block/page']?.['page/original-name'] || 'Unknown')}
          </span>
        ` : ''}
        ${block.capturedAt ? `
          <span class="lh-block-date">
            ${getIcon('time', 12)}
            ${formatDate(block.capturedAt)}
          </span>
        ` : ''}
      </div>
      <div class="lh-block-actions">
        ${block.highlightUrl ? `
          <a href="${block.highlightUrl}" class="lh-block-action" title="Jump to highlight">
            ${getIcon('arrowRight', 12)}
          </a>
        ` : ''}
        ${block.logseqUrl ? `
          <a href="${block.logseqUrl}" class="lh-block-action lh-action-primary" title="Open in Logseq">
            ${getIcon('link', 12)}
            Open
          </a>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Utility functions
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

