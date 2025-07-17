document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggle');
  const status = document.getElementById('status');
  
  // Get current status
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  updateUI(response.enabled);
  
  // Handle toggle click
  toggle.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_ENABLED' });
    updateUI(response.enabled);
  });
  
  function updateUI(enabled) {
    toggle.classList.toggle('active', enabled);
    status.textContent = enabled ? 'Active' : 'Inactive';
  }
});