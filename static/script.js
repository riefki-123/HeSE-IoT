// Enhanced JavaScript with better error handling and performance optimizations

class PPEMonitoringSystem {
    constructor() {
        this.statusUpdateInterval = null;
        this.connectionCheckInterval = null;
        this.isConnected = true;
        this.lastUpdateTime = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.baseRetryDelay = 1000; // 1 second
        
        // DOM elements
        this.statusDisplay = document.getElementById('status-display');
        this.statusTimestamp = document.getElementById('status-timestamp');
        this.connectionIndicator = document.getElementById('connection-indicator');
        this.videoStream = document.getElementById('video-stream');
        this.videoOverlay = document.getElementById('video-overlay');
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Status icons mapping
        this.statusIcons = {
            complete: '✅',
            no_vest: '⚠️',
            no_helmet: '⚠️',
            no_equipment: '❌',
            no_person: '❌',
            initializing: '🔄'
        };
        
        this.init();
    }
    
    init() {
        this.hideLoadingOverlay();
        this.startStatusUpdates();
        this.startConnectionCheck();
        this.setupEventListeners();
        
        // Update timestamp initially
        this.updateTimestamp();
    }
    
    hideLoadingOverlay() {
        setTimeout(() => {
            this.loadingOverlay.setAttribute('aria-hidden', 'true');
        }, 1500);
    }
    
    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
        
        // Handle online/offline events
        window.addEventListener('online', () => {
            this.handleConnectionRestore();
        });
        
        window.addEventListener('offline', () => {
            this.handleConnectionLoss();
        });
        
        // Handle video load events
        this.videoStream.addEventListener('load', () => {
            this.hideVideoError();
        });
        
        this.videoStream.addEventListener('error', () => {
            this.handleVideoError();
        });
    }
    
    startStatusUpdates() {
        // Initial update
        this.updateStatus();
        
        // Set up interval
        this.statusUpdateInterval = setInterval(() => {
            this.updateStatus();
        }, 1000);
    }
    
    startConnectionCheck() {
        this.connectionCheckInterval = setInterval(() => {
            this.checkConnection();
        }, 5000); // Check every 5 seconds
    }
    
    pauseUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }
    
    resumeUpdates() {
        if (!this.statusUpdateInterval) {
            this.startStatusUpdates();
        }
    }
    
    async updateStatus() {
        try {
            // Add updating animation
            this.statusDisplay.classList.add('updating');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch('/status', {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.handleStatusSuccess(data);
            
        } catch (error) {
            this.handleStatusError(error);
        } finally {
            // Remove updating animation
            setTimeout(() => {
                this.statusDisplay.classList.remove('updating');
            }, 500);
        }
    }
    
    handleStatusSuccess(data) {
        // Reset retry count on success
        this.retryCount = 0;
        
        // Update connection status
        this.updateConnectionStatus(true);
        
        // Process status data
        const status = data.status ? data.status.toLowerCase() : 'unknown';
        const statusText = this.formatStatusText(status);
        const statusIcon = this.statusIcons[status] || '❓';
        
        // Update status display
        this.updateStatusDisplay(status, statusIcon, statusText);
        
        // Update last update time
        this.lastUpdateTime = new Date();
        this.updateTimestamp();
        
        // Log successful update (for debugging)
        console.log(`Status updated: ${status} at ${this.lastUpdateTime.toLocaleTimeString()}`);
    }
    
    handleStatusError(error) {
        console.error('Error fetching status:', error);
        
        // Update connection status
        this.updateConnectionStatus(false);
        
        // Implement exponential backoff for retries
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            const delay = this.baseRetryDelay * Math.pow(2, this.retryCount - 1);
            console.log(`Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(() => {
                if (this.retryCount <= this.maxRetries) {
                    this.updateStatus();
                }
            }, delay);
        } else {
            // Max retries reached, show error state
            this.showErrorState();
        }
    }
    
    updateStatusDisplay(status, icon, text) {
        // Update icon
        const statusIcon = this.statusDisplay.querySelector('.status-icon');
        if (statusIcon) {
            statusIcon.textContent = icon;
        }
        
        // Update text
        const statusText = this.statusDisplay.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = text;
        }
        
        // Update CSS classes
        this.statusDisplay.className = 'status-box';
        this.statusDisplay.classList.add(`status-${status}`);
        
        // Update ARIA attributes for accessibility
        this.statusDisplay.setAttribute('aria-label', `Current status: ${text}`);
    }
    
    formatStatusText(status) {
        return status.replace(/_/g, ' ').toUpperCase();
    }
    
    updateTimestamp() {
        if (this.statusTimestamp && this.lastUpdateTime) {
            const timeString = this.lastUpdateTime.toLocaleTimeString();
            this.statusTimestamp.textContent = `Last updated: ${timeString}`;
        }
    }
    
    updateConnectionStatus(isConnected) {
        this.isConnected = isConnected;
        
        const indicatorDot = this.connectionIndicator.querySelector('.indicator-dot');
        const indicatorText = this.connectionIndicator.querySelector('.indicator-text');
        
        if (isConnected) {
            indicatorDot.classList.remove('disconnected');
            indicatorText.textContent = 'Connected';
        } else {
            indicatorDot.classList.add('disconnected');
            indicatorText.textContent = 'Disconnected';
        }
    }
    
    async checkConnection() {
        try {
            const response = await fetch('/health', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            this.updateConnectionStatus(response.ok);
        } catch (error) {
            this.updateConnectionStatus(false);
        }
    }
    
    handleConnectionLoss() {
        this.updateConnectionStatus(false);
        this.pauseUpdates();
        console.log('Connection lost - pausing updates');
    }
    
    handleConnectionRestore() {
        this.updateConnectionStatus(true);
        this.resumeUpdates();
        this.retryCount = 0; // Reset retry count
        console.log('Connection restored - resuming updates');
    }
    
    showErrorState() {
        this.updateStatusDisplay('error', '❌', 'CONNECTION ERROR');
        console.error('Max retries reached - showing error state');
    }
    
    handleVideoError() {
        console.error('Video stream error');
        this.videoOverlay.classList.add('show');
    }
    
    hideVideoError() {
        this.videoOverlay.classList.remove('show');
    }
    
    reloadVideo() {
        console.log('Reloading video stream');
        this.hideVideoError();
        
        // Force reload the video stream
        const currentSrc = this.videoStream.src;
        this.videoStream.src = '';
        
        setTimeout(() => {
            this.videoStream.src = currentSrc + '?t=' + Date.now();
        }, 100);
    }
    
    // Cleanup method for when the page is unloaded
    cleanup() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
        }
        
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }
    }
}

// Global functions for backward compatibility and video error handling
function handleVideoError() {
    if (window.ppeSystem) {
        window.ppeSystem.handleVideoError();
    }
}

function reloadVideo() {
    if (window.ppeSystem) {
        window.ppeSystem.reloadVideo();
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ppeSystem = new PPEMonitoringSystem();
});

// Cleanup when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.ppeSystem) {
        window.ppeSystem.cleanup();
    }
});

// Handle critical errors
window.addEventListener('error', (event) => {
    console.error('Critical error:', event.error);
    
    // Show user-friendly error message
    const statusDisplay = document.getElementById('status-display');
    if (statusDisplay) {
        statusDisplay.className = 'status-box status-no_equipment';
        statusDisplay.innerHTML = `
            <span class="status-icon">⚠️</span>
            <span class="status-text">SYSTEM ERROR</span>
        `;
    }
});

// Performance monitoring (optional)
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
        }, 0);
    });
}
