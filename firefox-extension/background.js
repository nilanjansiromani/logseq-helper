// Logseqy - Background Service Worker

// Default settings
const DEFAULT_SETTINGS = {
  apiHost: 'http://127.0.0.1:12315',
  apiToken: '',
  graphName: '',
  captureDestination: 'journal', // 'journal' or 'page'
  capturePageName: 'Quick Capture',
  captureFormats: [
    {
      id: 'todo',
      name: 'TODO',
      enabled: true,
      format: 'TODO {{content}} #quick-capture\nsource:: {{url}}',
      icon: 'todo'
    },
    {
      id: 'note',
      name: 'Note',
      enabled: true,
      format: '{{content}} #quick-capture\nsource:: {{url}}',
      icon: 'note'
    },
    {
      id: 'code',
      name: 'Code',
      enabled: true,
      format: '```\n{{content}}\n```\n#quick-capture\nsource:: {{url}}',
      icon: 'code'
    }
  ]
};

// Initialize settings on install
browser.runtime.onInstalled.addListener(async () => {
  const stored = await browser.storage.sync.get('settings');
  if (!stored.settings) {
    await browser.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
});

// Listen for keyboard shortcut
browser.commands.onCommand.addListener((command) => {
  if (command === 'toggle-overlay') {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, { action: 'toggleOverlay' });
      }
    });
  }
});

// Message handling
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender) {
  switch (request.action) {
    case 'getSettings':
      return getSettings();
    
    case 'saveSettings':
      return saveSettings(request.settings);
    
    case 'captureToLogseq':
      return captureToLogseq(request.data);
    
    case 'getBlocksForUrl':
      return getBlocksForUrl(request.url);
    
    case 'searchBlocks':
      return searchBlocks(request.query);
    
    case 'testConnection':
      return testConnection();
    
    case 'getGraphName':
      return getGraphName();
    
    case 'getCapturedBlocks':
      return getCapturedBlocksFromLogseq(request.url);
    
    case 'getRelatedBlocks':
      return getRelatedBlocksFromDomain(request.url);
    
    case 'getLogseqConfig':
      return getLogseqConfig();
    
    default:
      return { success: false, error: 'Unknown action' };
  }
}

async function getSettings() {
  const stored = await browser.storage.sync.get('settings');
  // Merge stored settings with defaults to ensure new fields are present
  if (stored.settings) {
    return { ...DEFAULT_SETTINGS, ...stored.settings };
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(settings) {
  await browser.storage.sync.set({ settings });
  return { success: true };
}

async function testConnection() {
  const settings = await getSettings();
  try {
    const response = await fetch(`${settings.apiHost}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        method: 'logseq.App.getCurrentGraph'
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getGraphName() {
  const settings = await getSettings();
  try {
    const response = await fetch(`${settings.apiHost}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        method: 'logseq.App.getCurrentGraph'
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return { success: true, graphName: data?.name || '' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get Logseq user configuration including journal date format
async function getLogseqConfig() {
  const settings = await getSettings();
  try {
    const response = await fetch(`${settings.apiHost}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        method: 'logseq.App.getUserConfigs'
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    console.log('Logseq config:', data);
    return { success: true, config: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Format a date using Logseq's date format pattern
function formatDateWithPattern(date, pattern) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  // Get ordinal suffix for day
  const getOrdinal = (n) => {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  // Replace patterns from longest to shortest to avoid partial replacements
  let result = pattern;
  
  // Year patterns
  result = result.replace(/yyyy/g, year.toString());
  result = result.replace(/yy/g, year.toString().slice(-2));
  
  // Month patterns (order matters - longest first)
  result = result.replace(/MMMM/g, monthsLong[month]);
  result = result.replace(/MMM/g, months[month]);
  result = result.replace(/MM/g, String(month + 1).padStart(2, '0'));
  result = result.replace(/M(?!a|o)/g, String(month + 1)); // M but not followed by 'a' (Mar) or 'o' (Mon)
  
  // Day of week patterns (order matters - longest first)
  result = result.replace(/EEEE/g, daysLong[dayOfWeek]);
  result = result.replace(/EEE/g, days[dayOfWeek]);
  result = result.replace(/E/g, days[dayOfWeek]);
  
  // Day patterns (order matters)
  result = result.replace(/do/g, day + getOrdinal(day));
  result = result.replace(/dd/g, String(day).padStart(2, '0'));
  result = result.replace(/d(?!e|a)/g, day.toString()); // d but not followed by 'e' (Dec) or 'a' (day name)
  
  return result;
}

async function captureToLogseq(data) {
  const settings = await getSettings();
  const { content, format, pageUrl, pageTitle, highlightUrl } = data;
  
  // Replace template variables
  let formattedContent = format
    .replace(/\{\{content\}\}/g, content)
    .replace(/\{\{url\}\}/g, pageUrl)
    .replace(/\{\{title\}\}/g, pageTitle)
    .replace(/\{\{highlightUrl\}\}/g, highlightUrl || pageUrl)
    .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
    .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());
  
  try {
    let targetPage;
    
    if (settings.captureDestination === 'journal') {
      const today = new Date();
      
      // Auto-detect journal format from Logseq configuration
      const configResult = await getLogseqConfig();
      let journalFormat = 'MMM do, yyyy'; // Default fallback
      
      if (configResult.success && configResult.config) {
        // Logseq stores the format in preferredDateFormat
        const detectedFormat = configResult.config.preferredDateFormat;
        if (detectedFormat) {
          journalFormat = detectedFormat;
          console.log('Auto-detected journal format:', journalFormat);
        }
      }
      
      // Format the date using the detected pattern
      targetPage = formatDateWithPattern(today, journalFormat);
      console.log('Target journal page:', targetPage);
    } else {
      targetPage = settings.capturePageName;
    }
    
    console.log('Capturing to page:', targetPage);
    console.log('Content:', formattedContent);
    
    // Use appendBlockInPage which takes a page name directly
    const response = await fetch(`${settings.apiHost}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        method: 'logseq.Editor.appendBlockInPage',
        args: [targetPage, formattedContent]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Logseq API error:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const result = await response.json();
    console.log('Logseq API result:', result);
    
    // Check if result indicates an error
    if (result === null || result === undefined) {
      // The page might not exist, try creating it first
      console.log('Page might not exist, trying to create...');
      
      // Create the page by getting/creating it
      const createPageResponse = await fetch(`${settings.apiHost}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiToken}`
        },
        body: JSON.stringify({
          method: 'logseq.Editor.createPage',
          args: [targetPage, {}, { createFirstBlock: false, redirect: false, journal: settings.captureDestination === 'journal' }]
        })
      });
      
      // Now try to append again
      const retryResponse = await fetch(`${settings.apiHost}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiToken}`
        },
        body: JSON.stringify({
          method: 'logseq.Editor.appendBlockInPage',
          args: [targetPage, formattedContent]
        })
      });
      
      if (!retryResponse.ok) {
        return { success: false, error: 'Failed to create page and insert block' };
      }
      
      const retryResult = await retryResponse.json();
      console.log('Retry result:', retryResult);
      
      return { 
        success: true, 
        blockId: retryResult?.uuid,
        logseqUrl: await buildLogseqUrl(retryResult?.uuid, settings)
      };
    }
    
    return { 
      success: true, 
      blockId: result?.uuid,
      logseqUrl: await buildLogseqUrl(result?.uuid, settings)
    };
  } catch (error) {
    console.error('Capture error:', error);
    return { success: false, error: error.message };
  }
}

async function buildLogseqUrl(uuid, settings) {
  if (!uuid) return null;
  const graphResult = await getGraphName();
  const graphName = graphResult.graphName || settings.graphName;
  return `logseq://graph/${graphName}?block-id=${uuid}`;
}

async function getBlocksForUrl(url) {
  const settings = await getSettings();
  
  try {
    // Search for blocks containing the URL
    const response = await fetch(`${settings.apiHost}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        method: 'logseq.DB.q',
        args: [`[:find (pull ?b [*]) :where [?b :block/content ?c] [(clojure.string/includes? ?c "${url}")]]`]
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, blocks: [] };
    }
    
    const data = await response.json();
    const blocks = (data || []).map(item => item[0]).filter(Boolean);
    
    // Get graph name for x-callback URLs
    const graphResult = await getGraphName();
    const graphName = graphResult.graphName || settings.graphName;
    
    // Add logseq URL to each block
    const enrichedBlocks = blocks.map(block => ({
      ...block,
      logseqUrl: block.uuid ? `logseq://graph/${graphName}?block-id=${block.uuid}` : null
    }));
    
    return { success: true, blocks: enrichedBlocks };
  } catch (error) {
    return { success: false, error: error.message, blocks: [] };
  }
}

// Query Logseq graph for blocks with source property matching the URL
async function getCapturedBlocksFromLogseq(url) {
  const settings = await getSettings();
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    console.log('Searching Logseq for domain:', domain);
    
    // Search for the domain name
    const response = await fetch(`${settings.apiHost}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        method: 'logseq.App.search',
        args: [domain]
      })
    });
    
    if (!response.ok) {
      console.error('Logseq search failed:', response.status);
      return { success: false, error: `HTTP ${response.status}`, blocks: [] };
    }
    
    const data = await response.json();
    console.log('Search result type:', typeof data, Array.isArray(data));
    
    // Handle the search result format
    let searchBlocks = [];
    if (Array.isArray(data)) {
      // Direct array of results
      searchBlocks = data.filter(item => item && typeof item === 'object');
    } else if (data && typeof data === 'object') {
      // Object with blocks property
      searchBlocks = data.blocks || [];
    }
    
    console.log('Total search results:', searchBlocks.length);
    
    // Get all blocks that have source:: with EXACT URL match
    const blocks = [];
    for (const block of searchBlocks) {
      const content = block['block/content'] || block.content || '';
      // Check for exact URL match in source:: property
      if (content.includes('source::') && content.includes(url)) {
        blocks.push(block);
      }
    }
    
    console.log('Blocks with exact URL match:', blocks.length);
    
    // Get graph name
    const graphResult = await getGraphName();
    const graphName = graphResult.graphName || settings.graphName;
    
    // Transform blocks
    const enrichedBlocks = blocks.map(block => {
      const content = block['block/content'] || block.content || '';
      const pageName = block['block/page'] || block.page || '';
      const uuid = block['block/uuid'] || block.uuid || '';
      
      return {
        uuid: uuid,
        content: content,
        sourceUrl: url,
        targetPage: typeof pageName === 'object' ? (pageName['block/original-name'] || pageName.name || '') : pageName,
        logseqUrl: uuid ? `logseq://graph/${graphName}?block-id=${uuid}` : null,
        highlightUrl: url,
        capturedAt: null
      };
    });
    
    return { success: true, blocks: enrichedBlocks };
  } catch (error) {
    console.error('Error searching Logseq:', error);
    return { success: false, error: error.message, blocks: [] };
  }
}

// Get all blocks from a domain (for "Related" section)
async function getRelatedBlocksFromDomain(url) {
  const settings = await getSettings();
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    console.log('Getting related blocks from domain:', domain);
    
    // Search for the domain name
    const response = await fetch(`${settings.apiHost}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        method: 'logseq.App.search',
        args: [domain]
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, blocks: [] };
    }
    
    const data = await response.json();
    
    // Handle the search result format
    let searchBlocks = [];
    if (Array.isArray(data)) {
      searchBlocks = data.filter(item => item && typeof item === 'object');
    } else if (data && typeof data === 'object') {
      searchBlocks = data.blocks || [];
    }
    
    // Get all blocks that have source:: with this domain
    const blocks = searchBlocks.filter(block => {
      const content = block['block/content'] || block.content || '';
      return content.includes('source::') && content.includes(domain);
    });
    
    // Get graph name
    const graphResult = await getGraphName();
    const graphName = graphResult.graphName || settings.graphName;
    
    // Transform blocks
    const enrichedBlocks = blocks.map(block => {
      const content = block['block/content'] || block.content || '';
      const uuid = block['block/uuid'] || block.uuid || '';
      
      return {
        uuid: uuid,
        content: content,
        logseqUrl: uuid ? `logseq://graph/${graphName}?block-id=${uuid}` : null
      };
    });
    
    return { success: true, blocks: enrichedBlocks };
  } catch (error) {
    console.error('Error getting related blocks:', error);
    return { success: false, error: error.message, blocks: [] };
  }
}

// Extract highlight URL from block content if present
function extractHighlightUrl(content) {
  const match = content.match(/source::\s*(\S+)/);
  if (match) {
    return match[1];
  }
  return null;
}

async function searchBlocks(query) {
  const settings = await getSettings();
  
  try {
    const response = await fetch(`${settings.apiHost}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        method: 'logseq.App.search',
        args: [query]
      })
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, blocks: [] };
    }
    
    const data = await response.json();
    return { success: true, blocks: data?.blocks || [] };
  } catch (error) {
    return { success: false, error: error.message, blocks: [] };
  }
}
