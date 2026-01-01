// Logseq Helper - Popup/Settings Script

let settings = null;
let editingFormatId = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load settings
  settings = await browser.runtime.sendMessage({ action: 'getSettings' });
  
  // Populate form
  populateForm();
  
  // Set up event listeners
  setupEventListeners();
  
  // Auto-detect journal format
  detectJournalFormat();
}

function populateForm() {
  // API Settings
  document.getElementById('apiHost').value = settings.apiHost || '';
  document.getElementById('apiToken').value = settings.apiToken || '';
  document.getElementById('graphName').value = settings.graphName || '';
  
  // Capture Settings
  if (settings.captureDestination === 'page') {
    document.getElementById('destPage').checked = true;
    document.getElementById('capturePageGroup').style.display = 'flex';
    document.getElementById('journalFormatGroup').style.display = 'none';
  } else {
    document.getElementById('destJournal').checked = true;
    document.getElementById('capturePageGroup').style.display = 'none';
    document.getElementById('journalFormatGroup').style.display = 'flex';
  }
  document.getElementById('capturePageName').value = settings.capturePageName || 'Quick Capture';
  
  // Render formats
  renderFormats();
}

async function detectJournalFormat() {
  const formatEl = document.getElementById('detectedJournalFormat');
  formatEl.textContent = 'Detecting...';
  formatEl.className = 'detected-format loading';
  
  try {
    const result = await browser.runtime.sendMessage({ action: 'getLogseqConfig' });
    
    if (result.success && result.config) {
      const format = result.config.preferredDateFormat;
      if (format) {
        formatEl.textContent = format;
        formatEl.className = 'detected-format';
        
        // Show example of today's date in this format
        const today = new Date();
        const example = formatDateExample(today, format);
        formatEl.title = `Today: ${example}`;
      } else {
        formatEl.textContent = 'MMM do, yyyy (default)';
        formatEl.className = 'detected-format';
      }
    } else {
      formatEl.textContent = 'Could not detect - check connection';
      formatEl.className = 'detected-format error';
    }
  } catch (error) {
    formatEl.textContent = 'Error: ' + error.message;
    formatEl.className = 'detected-format error';
  }
}

// Simple date format example (for tooltip preview)
function formatDateExample(date, pattern) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  const getOrdinal = (n) => {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  let result = pattern;
  result = result.replace(/yyyy/g, year.toString());
  result = result.replace(/yy/g, year.toString().slice(-2));
  result = result.replace(/MMMM/g, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month]);
  result = result.replace(/MMM/g, months[month]);
  result = result.replace(/MM/g, String(month + 1).padStart(2, '0'));
  result = result.replace(/EEEE/g, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]);
  result = result.replace(/EEE/g, days[dayOfWeek]);
  result = result.replace(/do/g, day + getOrdinal(day));
  result = result.replace(/dd/g, String(day).padStart(2, '0'));
  
  return result;
}

function renderFormats() {
  const container = document.getElementById('formatsContainer');
  container.innerHTML = settings.captureFormats.map(format => `
    <div class="format-card ${format.enabled ? '' : 'disabled'}" data-format-id="${format.id}">
      <span class="format-icon">${format.icon}</span>
      <div class="format-info">
        <div class="format-name">${format.name}</div>
        <div class="format-preview">${truncateFormat(format.format)}</div>
      </div>
      <span class="format-status material-icons">${format.enabled ? 'check_circle' : 'cancel'}</span>
    </div>
  `).join('');
  
  // Add click handlers
  container.querySelectorAll('.format-card').forEach(card => {
    card.addEventListener('click', () => {
      const formatId = card.dataset.formatId;
      openFormatModal(formatId);
    });
  });
}

function truncateFormat(format) {
  const maxLength = 40;
  const singleLine = format.replace(/\n/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.substring(0, maxLength) + '...';
}

function setupEventListeners() {
  // Test connection
  document.getElementById('testConnectionBtn').addEventListener('click', testConnection);
  
  // Toggle API token visibility
  document.getElementById('toggleToken').addEventListener('click', () => {
    const input = document.getElementById('apiToken');
    const icon = document.getElementById('toggleToken').querySelector('.material-icons');
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
    }
  });
  
  // Auto-detect graph name
  document.getElementById('detectGraph').addEventListener('click', detectGraphName);
  
  // Refresh journal format detection
  document.getElementById('refreshFormat').addEventListener('click', detectJournalFormat);
  
  // Capture destination change
  document.querySelectorAll('input[name="captureDestination"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const pageGroup = document.getElementById('capturePageGroup');
      const journalGroup = document.getElementById('journalFormatGroup');
      if (e.target.value === 'page') {
        pageGroup.style.display = 'flex';
        journalGroup.style.display = 'none';
      } else {
        pageGroup.style.display = 'none';
        journalGroup.style.display = 'flex';
      }
    });
  });
  
  // Add format button
  document.getElementById('addFormatBtn').addEventListener('click', () => {
    openFormatModal(null);
  });
  
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  
  // Modal events
  document.getElementById('closeModal').addEventListener('click', closeFormatModal);
  document.querySelector('.modal-backdrop').addEventListener('click', closeFormatModal);
  document.getElementById('cancelFormatBtn').addEventListener('click', closeFormatModal);
  document.getElementById('saveFormatBtn').addEventListener('click', saveFormat);
  document.getElementById('deleteFormatBtn').addEventListener('click', deleteFormat);
}

async function testConnection() {
  const statusEl = document.getElementById('connectionStatus');
  const btn = document.getElementById('testConnectionBtn');
  
  btn.disabled = true;
  btn.querySelector('.material-icons').textContent = 'sync';
  btn.querySelector('.material-icons').style.animation = 'spin 1s linear infinite';
  
  statusEl.classList.remove('success', 'error');
  statusEl.classList.add('visible');
  statusEl.innerHTML = '<span class="material-icons" style="font-size: 16px; vertical-align: middle;">hourglass_empty</span> Testing connection...';
  
  // Update settings temporarily for test
  const tempSettings = {
    ...settings,
    apiHost: document.getElementById('apiHost').value,
    apiToken: document.getElementById('apiToken').value
  };
  await browser.runtime.sendMessage({ action: 'saveSettings', settings: tempSettings });
  
  const result = await browser.runtime.sendMessage({ action: 'testConnection' });
  
  btn.disabled = false;
  btn.querySelector('.material-icons').textContent = 'sync';
  btn.querySelector('.material-icons').style.animation = '';
  
  if (result.success) {
    statusEl.classList.add('success');
    statusEl.innerHTML = '<span class="material-icons" style="font-size: 16px; vertical-align: middle;">check_circle</span> Connected successfully!';
    
    // Auto-fill graph name if detected
    if (result.data?.name) {
      document.getElementById('graphName').value = result.data.name;
    }
    
    // Also refresh the journal format detection
    detectJournalFormat();
  } else {
    statusEl.classList.add('error');
    statusEl.innerHTML = `<span class="material-icons" style="font-size: 16px; vertical-align: middle;">error</span> Connection failed: ${result.error}`;
  }
  
  // Hide after delay
  setTimeout(() => {
    statusEl.classList.remove('visible');
  }, 5000);
}

async function detectGraphName() {
  const btn = document.getElementById('detectGraph');
  const input = document.getElementById('graphName');
  
  btn.disabled = true;
  btn.querySelector('.material-icons').style.animation = 'spin 1s linear infinite';
  
  // Save current settings first
  const tempSettings = {
    ...settings,
    apiHost: document.getElementById('apiHost').value,
    apiToken: document.getElementById('apiToken').value
  };
  await browser.runtime.sendMessage({ action: 'saveSettings', settings: tempSettings });
  
  const result = await browser.runtime.sendMessage({ action: 'getGraphName' });
  
  btn.disabled = false;
  btn.querySelector('.material-icons').style.animation = '';
  
  if (result.success && result.graphName) {
    input.value = result.graphName;
    showNotification('Graph name detected!', 'success');
  } else {
    showNotification('Could not detect graph name. Check your API connection.', 'error');
  }
}

function openFormatModal(formatId) {
  editingFormatId = formatId;
  const modal = document.getElementById('formatModal');
  const deleteBtn = document.getElementById('deleteFormatBtn');
  
  if (formatId) {
    // Editing existing format
    const format = settings.captureFormats.find(f => f.id === formatId);
    if (!format) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Format';
    document.getElementById('formatName').value = format.name;
    document.getElementById('formatIcon').value = format.icon;
    document.getElementById('formatTemplate').value = format.format;
    document.getElementById('formatEnabled').checked = format.enabled;
    deleteBtn.style.display = 'flex';
  } else {
    // Creating new format
    document.getElementById('modalTitle').textContent = 'Add Format';
    document.getElementById('formatName').value = '';
    document.getElementById('formatIcon').value = '📝';
    document.getElementById('formatTemplate').value = '{{content}} #quick-capture\nsource:: {{url}}';
    document.getElementById('formatEnabled').checked = true;
    deleteBtn.style.display = 'none';
  }
  
  modal.classList.add('visible');
}

function closeFormatModal() {
  const modal = document.getElementById('formatModal');
  modal.classList.remove('visible');
  editingFormatId = null;
}

function saveFormat() {
  const name = document.getElementById('formatName').value.trim();
  const icon = document.getElementById('formatIcon').value.trim() || '📝';
  const format = document.getElementById('formatTemplate').value;
  const enabled = document.getElementById('formatEnabled').checked;
  
  if (!name || !format) {
    showNotification('Please fill in name and template', 'error');
    return;
  }
  
  if (editingFormatId) {
    // Update existing
    const index = settings.captureFormats.findIndex(f => f.id === editingFormatId);
    if (index !== -1) {
      settings.captureFormats[index] = {
        ...settings.captureFormats[index],
        name,
        icon,
        format,
        enabled
      };
    }
  } else {
    // Add new
    const id = 'custom-' + Date.now();
    settings.captureFormats.push({
      id,
      name,
      icon,
      format,
      enabled
    });
  }
  
  renderFormats();
  closeFormatModal();
  showNotification('Format saved! Remember to save settings.', 'success');
}

function deleteFormat() {
  if (!editingFormatId) return;
  
  // Don't allow deleting if only one format remains
  if (settings.captureFormats.length <= 1) {
    showNotification('Cannot delete the last format', 'error');
    return;
  }
  
  settings.captureFormats = settings.captureFormats.filter(f => f.id !== editingFormatId);
  renderFormats();
  closeFormatModal();
  showNotification('Format deleted! Remember to save settings.', 'success');
}

async function saveSettings() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-icons">hourglass_empty</span> Saving...';
  
  // Gather settings (journalFormat is now auto-detected, not saved)
  settings.apiHost = document.getElementById('apiHost').value.trim() || 'http://127.0.0.1:12315';
  settings.apiToken = document.getElementById('apiToken').value;
  settings.graphName = document.getElementById('graphName').value.trim();
  settings.captureDestination = document.querySelector('input[name="captureDestination"]:checked').value;
  settings.capturePageName = document.getElementById('capturePageName').value.trim() || 'Quick Capture';
  
  // Save
  const result = await browser.runtime.sendMessage({ action: 'saveSettings', settings });
  
  btn.disabled = false;
  btn.innerHTML = '<span class="material-icons">save</span> Save Settings';
  
  if (result.success) {
    showNotification('Settings saved successfully!', 'success');
  } else {
    showNotification('Failed to save settings', 'error');
  }
}

function showNotification(message, type) {
  const statusEl = document.getElementById('connectionStatus');
  statusEl.classList.remove('success', 'error');
  statusEl.classList.add('visible', type);
  statusEl.innerHTML = `<span class="material-icons" style="font-size: 16px; vertical-align: middle;">${type === 'success' ? 'check_circle' : 'error'}</span> ${message}`;
  
  setTimeout(() => {
    statusEl.classList.remove('visible');
  }, 3000);
}

// Add CSS for spinning animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
