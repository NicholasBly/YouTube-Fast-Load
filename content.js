(function() {
  'use strict';
  
  const CLEANUP_DELAY = 2000;
  const HISTORY_API_METHODS = ['pushState', 'replaceState'];
  
  let cleanupTimer = null;
  
  // Initialize
  function init() {
    // Monkey patch History API to detect navigation
    patchHistoryAPI();
    
    // Listen for popstate events
    window.addEventListener('popstate', handleNavigation);
    
    // Initial cleanup
    scheduleCleanup();
    
    // Listen for messages from background
    chrome.runtime.onMessage.addListener(handleMessage);
  }
  
  // Patch History API methods
  function patchHistoryAPI() {
    HISTORY_API_METHODS.forEach(method => {
      const original = history[method];
      history[method] = function(...args) {
        const result = original.apply(this, args);
        handleNavigation();
        return result;
      };
    });
  }
  
  // Handle navigation events
  function handleNavigation() {
    scheduleCleanup();
  }
  
  // Schedule URL cleanup
  function scheduleCleanup() {
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
    }
    
    cleanupTimer = setTimeout(() => {
      cleanupUrl();
    }, CLEANUP_DELAY);
  }
  
  // Clean playlist parameters from URL
  function cleanupUrl() {
    try {
      const url = new URL(window.location.href);
      
      // Check if we have artificial playlist params
      if (isArtificialPlaylist(url)) {
        // Remove playlist parameters
        url.searchParams.delete('list');
        url.searchParams.delete('index');
        
        // Update URL without reload
        const newUrl = url.toString();
        history.replaceState(history.state, '', newUrl);
        
        // Update any UI elements that might show the URL
        updateUIElements();
      }
    } catch (error) {
      console.error('Error cleaning URL:', error);
    }
  }
  
  // Check if playlist is artificial (added by extension)
  function isArtificialPlaylist(url) {
    const list = url.searchParams.get('list');
    const videoId = url.searchParams.get('v');
    
    return list && videoId && list.startsWith('RD') && list.includes(videoId);
  }
  
  // Update UI elements that might display playlist info
  function updateUIElements() {
    // Hide playlist panel if it's showing our artificial playlist
    const playlistPanel = document.querySelector('ytd-playlist-panel-renderer');
    if (playlistPanel) {
      const url = new URL(window.location.href);
      if (isArtificialPlaylist(url)) {
        playlistPanel.style.display = 'none';
      }
    }
    
    // Update title if needed
    updatePageTitle();
  }
  
  // Update page title to remove playlist references
  function updatePageTitle() {
    const titleElement = document.querySelector('h1.title');
    if (titleElement && document.title.includes('Mix -')) {
      // Remove "Mix - " prefix from title
      document.title = document.title.replace(/Mix\s*-\s*/, '');
    }
  }
  
  // Handle messages from background script
  function handleMessage(request, sender, sendResponse) {
    switch (request.type) {
      case 'TAB_UPDATED':
        scheduleCleanup();
        break;
    }
  }
  
  // Start the extension
  init();
})();