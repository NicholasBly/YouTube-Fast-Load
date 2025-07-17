const YOUTUBE_DOMAINS = ['youtube.com', 'www.youtube.com'];
const VIDEO_ID_REGEX = /[?&]v=([^&]+)/;
const PLAYLIST_PARAMS = {
  list: 'RD',  // Radio/mix playlist prefix
  index: '1'
};

// State management
const state = {
  enabled: true,
  processedTabs: new Set(),
  videoCache: new Map()
};

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
});

// Load saved state
chrome.storage.local.get(['enabled'], (result) => {
  state.enabled = result.enabled !== false;
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    state.enabled = changes.enabled.newValue;
  }
});

// Main request interceptor
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!state.enabled) return;
    
    try {
      const url = new URL(details.url);
      
      // Only process YouTube watch URLs
      if (!isYouTubeWatchUrl(url)) return;
      
      // Extract video ID
      const videoId = extractVideoId(url);
      if (!videoId) return;
      
      // Check if already has playlist parameters
      if (hasPlaylistParams(url)) return;
      
      // Create modified URL with playlist parameters
      const modifiedUrl = createPlaylistUrl(url, videoId);
      
      // Cache the modification for content script
      state.videoCache.set(videoId, {
        originalUrl: details.url,
        modifiedUrl: modifiedUrl.toString(),
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      cleanCache();
      
      return { redirectUrl: modifiedUrl.toString() };
    } catch (error) {
      console.error('Error processing request:', error);
      return;
    }
  },
  {
    urls: ['*://*.youtube.com/watch*'],
    types: ['main_frame', 'sub_frame']
  },
  ['blocking']
);

// Helper functions
function isYouTubeWatchUrl(url) {
  return YOUTUBE_DOMAINS.includes(url.hostname) && 
         url.pathname === '/watch';
}

function extractVideoId(url) {
  const match = url.search.match(VIDEO_ID_REGEX);
  return match ? match[1] : null;
}

function hasPlaylistParams(url) {
  return url.searchParams.has('list') || 
         url.searchParams.has('index');
}

function createPlaylistUrl(url, videoId) {
  const modifiedUrl = new URL(url.toString());
  modifiedUrl.searchParams.set('list', `${PLAYLIST_PARAMS.list}${videoId}`);
  modifiedUrl.searchParams.set('index', PLAYLIST_PARAMS.index);
  return modifiedUrl;
}

function cleanCache() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [key, value] of state.videoCache.entries()) {
    if (now - value.timestamp > maxAge) {
      state.videoCache.delete(key);
    }
  }
}

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!state.enabled) return;
  
  if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com')) {
    // Send message to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'TAB_UPDATED',
      url: tab.url
    }).catch(() => {
      // Tab might not have content script loaded yet
    });
  }
});

// Message handler for communication with content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'GET_STATUS':
      sendResponse({ enabled: state.enabled });
      break;
      
    case 'TOGGLE_ENABLED':
      state.enabled = !state.enabled;
      chrome.storage.local.set({ enabled: state.enabled });
      sendResponse({ enabled: state.enabled });
      break;
      
    case 'GET_VIDEO_INFO':
      const info = state.videoCache.get(request.videoId);
      sendResponse({ info });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  return true;
});