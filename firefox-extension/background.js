// Logseq Helper - Background Script (Firefox)

// Browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Default settings
const DEFAULT_SETTINGS = {
  apiHost: 'http://127.0.0.1:12315',
  apiToken: '',
  graphName: '',
  captureDestination: 'journal', // 'journal' or 'page'
  capturePageName: 'Quick Capture',
  journalFormat: 'MMM do, yyyy', // 'MMM do, yyyy' (Dec 2nd, 2025) or 'yyyy-MM-dd' (2025-12-02)
  captureFormats: [
    {
      id: 'todo',
      name: 'TODO',
      enabled: true,
      format: 'TODO {{content}}\nsource:: [{{title}}]({{url}})',
      icon: 'todo'
    },
    {
      id: 'quote',
      name: 'Quote',
      enabled: true,
      format: '> {{content}}',
      icon: 'quote'
    },
    {
      id: 'note',
      name: 'Note',
      enabled: true,
      format: '{{content}}\nsource:: [{{title}}]({{url}})',
      icon: 'note'
    },
    {
      id: 'code',
      name: 'Code',
      enabled: true,
      format: '🌐 : {{url}}\n```js\n{{content}}\n```',
      icon: 'code'
    }
  ]
};

// Initialize settings on install
browserAPI.runtime.onInstalled.addListener(async () => {
  const stored = await browserAPI.storage.sync.get('settings');
  if (!stored.settings) {
    await browserAPI.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
  
  // Initialize captured blocks storage
  const capturedBlocks = await browserAPI.storage.local.get('capturedBlocks');
  if (!capturedBlocks.capturedBlocks) {
    await browserAPI.storage.local.set({ capturedBlocks: [] });
  }
});

// Listen for keyboard shortcut
browserAPI.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-overlay') {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      browserAPI.tabs.sendMessage(tabs[0].id, { action: 'toggleOverlay' });
    }
  }
});

// Message handling
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
      return getCapturedBlocks(request.url);
    
    default:
      return { success: false, error: 'Unknown action' };
  }
}

async function getSettings() {
  const stored = await browserAPI.storage.sync.get('settings');
  // Merge stored settings with defaults to ensure new fields are present
  if (stored.settings) {
    return { ...DEFAULT_SETTINGS, ...stored.settings };
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(settings) {
  await browserAPI.storage.sync.set({ settings });
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
      
      // Format based on user's journal format setting
      const journalFormat = settings.journalFormat || 'MMM do, yyyy';
      
      if (journalFormat === 'yyyy-MM-dd') {
        // ISO format: 2025-12-02
        targetPage = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      } else if (journalFormat === 'yyyy_MM_dd') {
        // Underscore format: 2025_12_02
        targetPage = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
      } else if (journalFormat === 'MM-dd-yyyy') {
        // US format: 12-02-2025
        targetPage = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
      } else if (journalFormat === 'dd-MM-yyyy') {
        // EU format: 02-12-2025
        targetPage = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
      } else {
        // Default Logseq format: "Dec 2nd, 2025" (MMM do, yyyy)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = today.getDate();
        const suffix = getDaySuffix(day);
        targetPage = `${months[today.getMonth()]} ${day}${suffix}, ${today.getFullYear()}`;
      }
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
          args: [targetPage, {}, { createFirstBlock: false, redirect: false }]
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
      
      // Store the captured block locally
      await storeCapuredBlock(retryResult, formattedContent, pageUrl, pageTitle, highlightUrl, targetPage, settings);
      
      return { 
        success: true, 
        blockId: retryResult?.uuid,
        logseqUrl: await buildLogseqUrl(retryResult?.uuid, settings)
      };
    }
    
    // Store the captured block locally
    await storeCapuredBlock(result, formattedContent, pageUrl, pageTitle, highlightUrl, targetPage, settings);
    
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

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

async function storeCapuredBlock(result, formattedContent, pageUrl, pageTitle, highlightUrl, targetPage, settings) {
  const capturedBlocks = await browserAPI.storage.local.get('capturedBlocks');
  const blocks = capturedBlocks.capturedBlocks || [];
  blocks.push({
    uuid: result?.uuid || `local-${Date.now()}`,
    content: formattedContent,
    sourceUrl: pageUrl,
    sourceTitle: pageTitle,
    highlightUrl: highlightUrl,
    capturedAt: new Date().toISOString(),
    targetPage: targetPage
  });
  await browserAPI.storage.local.set({ capturedBlocks: blocks });
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

async function getCapturedBlocks(url) {
  const capturedBlocks = await browserAPI.storage.local.get('capturedBlocks');
  const blocks = capturedBlocks.capturedBlocks || [];
  
  // Filter blocks for this URL
  const urlBlocks = blocks.filter(block => {
    try {
      const sourceUrl = new URL(block.sourceUrl).origin + new URL(block.sourceUrl).pathname;
      const currentUrl = new URL(url).origin + new URL(url).pathname;
      return sourceUrl === currentUrl;
    } catch (e) {
      return false;
    }
  });
  
  // Get graph name for x-callback URLs
  const settings = await getSettings();
  const graphResult = await getGraphName();
  const graphName = graphResult.graphName || settings.graphName;
  
  // Add logseq URL to each block
  const enrichedBlocks = urlBlocks.map(block => ({
    ...block,
    logseqUrl: block.uuid && !block.uuid.startsWith('local-') 
      ? `logseq://graph/${graphName}?block-id=${block.uuid}` 
      : null
  }));
  
  return { success: true, blocks: enrichedBlocks };
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
