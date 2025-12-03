// Purge Proxy - Scramjet Implementation
class PurgeProxy {
    constructor() {
        this.scramjet = null;
        this.bareMux = null;
        this.currentUrl = '';
        this.history = [];
        this.historyIndex = -1;
        this.zoomLevel = 1;
        this.requestCount = 0;
        this.isInitialized = false;
        this.proxyMode = 'scramjet';
        this.transportType = 'baremux';
        
        // DOM Elements
        this.elements = {
            // Input elements
            urlInput: document.getElementById('url-input'),
            loadBtn: document.getElementById('load-btn'),
            
            // Frame and views
            proxyFrame: document.getElementById('proxy-frame'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            
            // Status elements
            loadingTitle: document.getElementById('loading-title'),
            loadingMessage: document.getElementById('loading-message'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            currentUrl: document.getElementById('current-url').querySelector('.url-text'),
            
            // Error elements
            errorTitle: document.getElementById('error-title'),
            errorMessage: document.getElementById('error-message'),
            errorUrl: document.getElementById('error-url'),
            errorCode: document.getElementById('error-code'),
            errorTime: document.getElementById('error-time'),
            
            // Status bar
            globalStatus: document.getElementById('global-status'),
            proxyType: document.getElementById('proxy-type'),
            transportType: document.getElementById('transport-type'),
            securityStatus: document.getElementById('security-status'),
            loadTime: document.getElementById('load-time'),
            frameSize: document.getElementById('frame-size'),
            connectionStatus: document.getElementById('connection-status'),
            requestsCount: document.getElementById('requests-count'),
            
            // Console
            consoleOutput: document.getElementById('console-output'),
            
            // Modals
            settingsModal: document.getElementById('settings-modal'),
            helpModal: document.getElementById('help-modal'),
            
            // Controls
            backBtn: document.getElementById('back-btn'),
            forwardBtn: document.getElementById('forward-btn')
        };
        
        this.init();
    }
    
    async init() {
        this.log('🚀 Initializing Purge Proxy...', 'info');
        this.updateProgress(10, 'Loading core modules');
        
        try {
            // Setup event listeners first
            this.setupEventListeners();
            this.updateProgress(20, 'Event listeners ready');
            
            // Initialize Scramjet if available
            await this.initScramjet();
            
            // Initialize BareMux
            await this.initBareMux();
            
            // Register service worker
            await this.registerServiceWorker();
            
            // Setup modals
            this.setupModals();
            
            this.isInitialized = true;
            this.updateStatus('connected', 'Ready');
            this.updateProgress(100, 'Proxy system ready');
            this.log('✅ Proxy system initialized successfully', 'success');
            
            // Auto-load Cookie Clicker after delay
            setTimeout(() => {
                this.loadUrl('https://orteil.dashnet.org/cookieclicker/');
            }, 500);
            
        } catch (error) {
            this.log(`❌ Initialization failed: ${error.message}`, 'error');
            this.showError('Initialization Error', error.message);
            this.updateStatus('error', 'Initialization Failed');
            
            // Enable fallback mode
            setTimeout(() => {
                this.enableFallbackMode();
            }, 1000);
        }
    }
    
    async initScramjet() {
        this.updateProgress(30, 'Loading Scramjet engine');
        
        // Check if Scramjet files are available
        const scramjetAvailable = await this.checkFileExists('/scram/scramjet.all.js');
        
        if (scramjetAvailable) {
            this.log('📦 Scramjet files detected', 'info');
            
            // Wait for Scramjet to load
            try {
                // Scramjet should be loaded via script tags in HTML
                await this.waitForScramjet();
                
                if (window.ScramjetController) {
                    this.scramjet = new window.ScramjetController({
                        files: {
                            wasm: "/scram/scramjet.wasm.wasm",
                            all: "/scram/scramjet.all.js",
                            sync: "/scram/scramjet.sync.js",
                        },
                    });
                    
                    await this.scramjet.init();
                    window.scramjet = this.scramjet;
                    
                    this.log('✅ Scramjet engine initialized', 'success');
                    this.updateProgress(50, 'Scramjet engine ready');
                    return;
                }
            } catch (error) {
                this.log(`⚠️ Scramjet initialization failed: ${error.message}`, 'warning');
            }
        }
        
        // Create mock Scramjet if real one isn't available
        this.createMockScramjet();
        this.log('📝 Using mock Scramjet engine', 'warning');
    }
    
    async waitForScramjet() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const check = () => {
                attempts++;
                if (window.ScramjetController) {
                    resolve();
                } else if (attempts < 30) {
                    setTimeout(check, 100);
                } else {
                    reject(new Error('Scramjet not loaded'));
                }
            };
            check();
        });
    }
    
    createMockScramjet() {
        // Mock ScramjetController
        window.ScramjetController = class MockScramjetController {
            constructor(config) {
                this.config = config;
                this.initialized = false;
            }
            
            async init() {
                this.initialized = true;
                return this;
            }
            
            encodeUrl(url) {
                // Mock encoding - in real Scramjet this would be complex
                try {
                    const urlObj = new URL(url);
                    // Simulate Scramjet encoding pattern
                    return `/scramjet/${btoa(url)}`;
                } catch {
                    return `/scramjet/${btoa('https://' + url)}`;
                }
            }
        };
        
        this.scramjet = new window.ScramjetController({
            files: {
                wasm: "/scram/scramjet.wasm.wasm",
                all: "/scram/scramjet.all.js",
                sync: "/scram/scramjet.sync.js",
            },
        });
    }
    
    async initBareMux() {
        this.updateProgress(60, 'Setting up transport layer');
        
        try {
            // Check if BareMux is loaded
            if (window.BareMux && window.BareMux.BareMuxConnection) {
                this.bareMux = new window.BareMux.BareMuxConnection("/baremux/worker.js");
                
                // Configure WISP transport
                const wispUrl = (location.protocol === "https:" ? "wss" : "ws") +
                    "://" + location.host + "/wisp/";
                
                try {
                    await this.bareMux.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                    this.log('✅ BareMux transport configured with WISP', 'success');
                    this.elements.transportType.textContent = 'BareMux (WISP)';
                } catch (error) {
                    this.log(`⚠️ BareMux transport setup failed: ${error.message}`, 'warning');
                    this.elements.transportType.textContent = 'BareMux (Fallback)';
                }
            } else {
                this.log('📝 Using fetch transport (BareMux not available)', 'warning');
                this.elements.transportType.textContent = 'Fetch API';
            }
            
            this.updateProgress(70, 'Transport layer ready');
            
        } catch (error) {
            this.log(`⚠️ BareMux initialization failed: ${error.message}`, 'warning');
            this.elements.transportType.textContent = 'Direct';
        }
    }
    
    async registerServiceWorker() {
        this.updateProgress(80, 'Registering service worker');
        
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                this.log(`✅ Service Worker registered: ${registration.scope}`, 'success');
                
                // Send port to service worker if BareMux is available
                if (this.bareMux && registration.active) {
                    try {
                        const port = this.bareMux.getInnerPort();
                        if (port) {
                            registration.active.postMessage({
                                type: "getPort",
                                port: port
                            }, [port]);
                            this.log('🔗 Port sent to Service Worker', 'info');
                        }
                    } catch (error) {
                        this.log(`⚠️ Could not send port to Service Worker: ${error.message}`, 'warning');
                    }
                }
            } catch (error) {
                this.log(`⚠️ Service Worker registration failed: ${error.message}`, 'warning');
            }
        } else {
            this.log('📝 Service Workers not supported', 'info');
        }
    }
    
    setupEventListeners() {
        // Load button and Enter key
        this.elements.loadBtn.addEventListener('click', () => this.loadCurrentUrl());
        this.elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadCurrentUrl();
        });
        
        // Quick links
        document.querySelectorAll('.quick-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                this.loadUrl(url);
            });
        });
        
        // Toolbar buttons
        this.elements.backBtn.addEventListener('click', () => this.goBack());
        this.elements.forwardBtn.addEventListener('click', () => this.goForward());
        document.getElementById('reload-btn').addEventListener('click', () => this.reload());
        document.getElementById('home-btn').addEventListener('click', () => this.goHome());
        document.getElementById('new-tab-btn').addEventListener('click', () => this.openNewTab());
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('devtools-btn').addEventListener('click', () => this.openDevTools());
        
        // Error buttons
        document.getElementById('retry-btn').addEventListener('click', () => this.retry());
        document.getElementById('fallback-btn').addEventListener('click', () => this.enableFallbackMode());
        document.getElementById('report-btn').addEventListener('click', () => this.reportIssue());
        
        // Console controls
        document.getElementById('clear-console').addEventListener('click', () => this.clearConsole());
        document.getElementById('toggle-console').addEventListener('click', () => this.toggleConsole());
        
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => this.adjustZoom(0.1));
        document.getElementById('zoom-out').addEventListener('click', () => this.adjustZoom(-0.1));
        document.getElementById('zoom-reset').addEventListener('click', () => this.resetZoom());
        
        // Frame events
        this.elements.proxyFrame.addEventListener('load', () => this.onFrameLoad());
        this.elements.proxyFrame.addEventListener('error', () => this.onFrameError());
        
        // Settings modal
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.hideSettings());
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());
        
        // Help and about
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('about-btn').addEventListener('click', () => this.showAbout());
        document.getElementById('close-help').addEventListener('click', () => this.hideHelp());
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
    }
    
    setupModals() {
        // Close modals on overlay click
        [this.elements.settingsModal, this.elements.helpModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    async loadCurrentUrl() {
        const url = this.elements.urlInput.value.trim();
        if (url) {
            await this.loadUrl(url);
        }
    }
    
    async loadUrl(url) {
        this.showLoading('Connecting to proxy...');
        this.hideError();
        
        // Update UI
        this.elements.urlInput.value = url;
        this.elements.currentUrl.textContent = url;
        this.currentUrl = url;
        
        // Add to history
        this.addToHistory(url);
        
        this.requestCount++;
        this.elements.requestsCount.textContent = `Requests: ${this.requestCount}`;
        
        this.log(`🌐 Loading: ${url}`, 'info');
        
        try {
            if (this.proxyMode === 'scramjet' && this.scramjet) {
                await this.loadViaScramjet(url);
            } else if (this.proxyMode === 'cors') {
                await this.loadViaCorsProxy(url);
            } else {
                await this.loadDirect(url);
            }
        } catch (error) {
            this.showError('Load Failed', error.message);
            this.log(`❌ Load failed: ${error.message}`, 'error');
        }
    }
    
    async loadViaScramjet(url) {
        this.updateProgress(30, 'Encoding URL via Scramjet');
        
        try {
            const encodedUrl = this.scramjet.encodeUrl(url);
            this.log(`🔗 Encoded URL: ${encodedUrl}`, 'info');
            
            this.updateProgress(60, 'Setting up transport');
            this.elements.proxyFrame.src = encodedUrl;
            this.elements.proxyType.textContent = 'Scramjet';
            
        } catch (error) {
            throw new Error(`Scramjet encoding failed: ${error.message}`);
        }
    }
    
    async loadViaCorsProxy(url) {
        this.updateProgress(30, 'Connecting to CORS proxy');
        
        try {
            // Try different CORS proxies
            const proxies = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                `https://corsproxy.io/?${encodeURIComponent(url)}`,
                `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`
            ];
            
            let success = false;
            for (const proxyUrl of proxies) {
                try {
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        const html = await response.text();
                        const processedHtml = this.processHTML(html, url);
                        
                        const blob = new Blob([processedHtml], { type: 'text/html' });
                        const blobUrl = URL.createObjectURL(blob);
                        
                        this.elements.proxyFrame.src = blobUrl;
                        this.elements.proxyType.textContent = 'CORS Proxy';
                        success = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!success) {
                throw new Error('All CORS proxies failed');
            }
            
        } catch (error) {
            throw new Error(`CORS proxy failed: ${error.message}`);
        }
    }
    
    async loadDirect(url) {
        this.updateProgress(30, 'Direct connection');
        
        try {
            this.elements.proxyFrame.src = url;
            this.elements.proxyType.textContent = 'Direct';
            this.elements.securityStatus.textContent = '⚠️ Insecure';
            this.elements.securityStatus.style.color = '#f59e0b';
            
        } catch (error) {
            throw new Error(`Direct load failed: ${error.message}`);
        }
    }
    
    processHTML(html, baseUrl) {
        // Simple HTML processing to fix relative URLs
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Add base tag
        const base = doc.createElement('base');
        base.href = baseUrl;
        doc.head.prepend(base);
        
        // Process common tags
        const tags = {
            'a': 'href',
            'img': 'src',
            'script': 'src',
            'link': 'href',
            'iframe': 'src',
            'form': 'action'
        };
        
        for (const [tag, attr] of Object.entries(tags)) {
            doc.querySelectorAll(`${tag}[${attr}]`).forEach(el => {
                const value = el.getAttribute(attr);
                if (value && !value.startsWith('http') && !value.startsWith('data:')) {
                    try {
                        const absoluteUrl = new URL(value, baseUrl).href;
                        el.setAttribute(attr, absoluteUrl);
                    } catch (e) {
                        // Keep original value if URL parsing fails
                    }
                }
            });
        }
        
        return doc.documentElement.outerHTML;
    }
    
    onFrameLoad() {
        this.hideLoading();
        this.updateLoadTime();
        this.updateStatus('connected', 'Loaded');
        this.log(`✅ Page loaded successfully`, 'success');
        
        // Update history buttons
        this.updateHistoryButtons();
    }
    
    onFrameError() {
        this.hideLoading();
        this.showError('Frame Error', 'Failed to load content in the frame');
        this.updateStatus('error', 'Load Failed');
    }
    
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.loadUrl(url);
        }
    }
    
    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.loadUrl(url);
        }
    }
    
    goHome() {
        this.loadUrl('https://orteil.dashnet.org/cookieclicker/');
    }
    
    reload() {
        if (this.elements.proxyFrame.src) {
            this.elements.proxyFrame.src = this.elements.proxyFrame.src;
            this.showLoading('Reloading...');
            this.log('↻ Reloading page', 'info');
        }
    }
    
    openNewTab() {
        if (this.currentUrl) {
            window.open(this.currentUrl, '_blank');
            this.log(`📄 Opened in new tab: ${this.currentUrl}`, 'info');
        }
    }
    
    toggleFullscreen() {
        const elem = this.elements.proxyFrame;
        
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
            this.log('⛶ Entered fullscreen mode', 'info');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            this.log('⛶ Exited fullscreen mode', 'info');
        }
    }
    
    openDevTools() {
        try {
            // This is a mock - in reality you'd need same-origin access
            this.log('🔧 DevTools access attempted', 'info');
            alert('Developer Tools access requires same-origin permissions. Try right-clicking on the iframe.');
        } catch (error) {
            this.log('⚠️ Cannot access iframe DevTools', 'warning');
        }
    }
    
    retry() {
        this.hideError();
        if (this.currentUrl) {
            this.loadUrl(this.currentUrl);
        }
    }
    
    enableFallbackMode() {
        this.hideError();
        this.proxyMode = 'cors';
        this.elements.proxyType.textContent = 'CORS (Fallback)';
        this.log('🔄 Switched to fallback proxy mode', 'warning');
        
        if (this.currentUrl) {
            this.loadUrl(this.currentUrl);
        }
    }
    
    reportIssue() {
        const issue = {
            url: this.currentUrl,
            error: this.elements.errorMessage.textContent,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        console.log('Issue Report:', issue);
        this.log('📋 Issue reported to console', 'info');
        alert('Issue details logged to console. Please check the developer console for details.');
    }
    
    adjustZoom(delta) {
        this.zoomLevel = Math.max(0.5, Math.min(2, this.zoomLevel + delta));
        this.elements.proxyFrame.style.transform = `scale(${this.zoomLevel})`;
        this.elements.proxyFrame.style.transformOrigin = 'top left';
        this.elements.frameSize.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        
        this.log(`🔍 Zoom: ${Math.round(this.zoomLevel * 100)}%`, 'info');
    }
    
    resetZoom() {
        this.zoomLevel = 1;
        this.elements.proxyFrame.style.transform = 'scale(1)';
        this.elements.frameSize.textContent = '100%';
        this.log('🔍 Zoom reset to 100%', 'info');
    }
    
    addToHistory(url) {
        // Remove any future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(url);
        this.historyIndex = this.history.length - 1;
    }
    
    updateHistoryButtons() {
        this.elements.backBtn.disabled = this.historyIndex <= 0;
        this.elements.forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    showLoading(message = 'Loading...') {
        this.elements.loadingTitle.textContent = 'Loading Page';
        this.elements.loadingMessage.textContent = message;
        this.elements.loading.style.display = 'flex';
        this.elements.error.style.display = 'none';
        this.elements.proxyFrame.style.display = 'none';
    }
    
    hideLoading() {
        this.elements.loading.style.display = 'none';
        this.elements.proxyFrame.style.display = 'block';
    }
    
    showError(title, message) {
        this.elements.errorTitle.textContent = title;
        this.elements.errorMessage.textContent = message;
        this.elements.errorUrl.textContent = this.currentUrl || '-';
        this.elements.errorCode.textContent = 'ERR_PROXY_FAILED';
        this.elements.errorTime.textContent = new Date().toLocaleString();
        
        this.elements.error.style.display = 'flex';
        this.elements.loading.style.display = 'none';
        this.elements.proxyFrame.style.display = 'none';
    }
    
    hideError() {
        this.elements.error.style.display = 'none';
    }
    
    updateProgress(percent, message) {
        this.elements.progressFill.style.width = `${percent}%`;
        this.elements.progressText.textContent = `${percent}%`;
        if (message) {
            this.elements.loadingMessage.textContent = message;
        }
    }
    
    updateStatus(type, text) {
        const statusDot = this.elements.globalStatus.querySelector('.status-dot');
        const statusText = this.elements.globalStatus.querySelector('.status-text');
        
        statusDot.className = 'status-dot';
        if (type === 'connected') {
            statusDot.classList.add('connected');
        } else if (type === 'error') {
            statusDot.classList.add('error');
        }
        
        statusText.textContent = text;
        this.elements.connectionStatus.textContent = text;
    }
    
    updateLoadTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        this.elements.loadTime.textContent = timeString;
    }
    
    showSettings() {
        // Load current settings
        const settings = this.getSettings();
        document.getElementById('proxy-select').value = settings.proxyMode;
        document.getElementById('transport-select').value = settings.transportType;
        document.getElementById('cache-enabled').checked = settings.cacheEnabled;
        document.getElementById('compression-enabled').checked = settings.compressionEnabled;
        document.getElementById('cookies-enabled').checked = settings.cookiesEnabled;
        document.getElementById('tracking-protection').checked = settings.trackingProtection;
        
        this.elements.settingsModal.style.display = 'flex';
    }
    
    hideSettings() {
        this.elements.settingsModal.style.display = 'none';
    }
    
    saveSettings() {
        const settings = {
            proxyMode: document.getElementById('proxy-select').value,
            transportType: document.getElementById('transport-select').value,
            cacheEnabled: document.getElementById('cache-enabled').checked,
            compressionEnabled: document.getElementById('compression-enabled').checked,
            cookiesEnabled: document.getElementById('cookies-enabled').checked,
            trackingProtection: document.getElementById('tracking-protection').checked
        };
        
        localStorage.setItem('proxySettings', JSON.stringify(settings));
        this.proxyMode = settings.proxyMode;
        
        this.hideSettings();
        this.log('⚙️ Settings saved', 'success');
        
        // Apply settings
        if (this.currentUrl) {
            this.reload();
        }
    }
    
    resetSettings() {
        localStorage.removeItem('proxySettings');
        this.hideSettings();
        this.showSettings(); // Reload default settings
        this.log('⚙️ Settings reset to defaults', 'info');
    }
    
    getSettings() {
        const defaults = {
            proxyMode: 'scramjet',
            transportType: 'baremux',
            cacheEnabled: true,
            compressionEnabled: true,
            cookiesEnabled: false,
            trackingProtection: true
        };
        
        try {
            const saved = localStorage.getItem('proxySettings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    }
    
    showHelp() {
        this.elements.helpModal.style.display = 'flex';
    }
    
    hideHelp() {
        this.elements.helpModal.style.display = 'none';
    }
    
    showAbout() {
        alert('Purge Proxy v2.1.7\n\nA Scramjet-style proxy implementation with BareMux transport.\n\nCreated for educational purposes.');
    }
    
    toggleTheme() {
        const body = document.body;
        const isDark = body.style.getPropertyValue('--dark') || getComputedStyle(body).getPropertyValue('--dark');
        
        if (isDark === '#0f172a') {
            // Switch to light theme
            body.style.setProperty('--dark', '#f8fafc');
            body.style.setProperty('--dark-light', '#e2e8f0');
            body.style.setProperty('--white', '#0f172a');
            body.style.setProperty('--gray-light', '#475569');
            body.style.setProperty('--border', '#cbd5e1');
            this.log('🌙 Switched to dark theme', 'info');
        } else {
            // Switch to dark theme
            body.style.setProperty('--dark', '#0f172a');
            body.style.setProperty('--dark-light', '#1e293b');
            body.style.setProperty('--white', '#f8fafc');
            body.style.setProperty('--gray-light', '#cbd5e1');
            body.style.setProperty('--border', '#334155');
            this.log('☀️ Switched to light theme', 'info');
        }
    }
    
    toggleConsole() {
        const consoleElem = document.querySelector('.debug-console');
        const toggleBtn = document.getElementById('toggle-console');
        
        if (consoleElem.style.maxHeight && consoleElem.style.maxHeight !== '0px') {
            consoleElem.style.maxHeight = '0px';
            toggleBtn.textContent = '▼';
        } else {
            consoleElem.style.maxHeight = '200px';
            toggleBtn.textContent = '▲';
        }
    }
    
    clearConsole() {
        this.elements.consoleOutput.innerHTML = '';
        this.log('🗑️ Console cleared', 'info');
    }
    
    log(message, type = 'info') {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[${timeString}]</span>
            <span class="log-message">${message}</span>
        `;
        
        this.elements.consoleOutput.appendChild(logEntry);
        this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
        
        console.log(`[PurgeProxy] ${message}`);
    }
    
    async checkFileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Initialize the proxy when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.proxy = new PurgeProxy();
    
    // Add global helper functions
    window.sjEncode = function(url) {
        if (window.scramjet && window.scramjet.encodeUrl) {
            return window.scramjet.encodeUrl(url);
        }
        return url;
    };
    
    window.sjEncodeAndGo = function(url) {
        const encoded = window.sjEncode(url);
        window.location.href = encoded;
    };
    
    // Search function
    window.search = function(query, engine = 'ddg') {
        try {
            new URL(query);
            return query;
        } catch {
            const engines = {
                google: 'https://www.google.com/search?q=',
                bing: 'https://www.bing.com/search?q=',
                ddg: 'https://duckduckgo.com/?q=',
                yahoo: 'https://search.yahoo.com/search?p=',
                brave: 'https://search.brave.com/search?q=',
                startpage: 'https://www.startpage.com/sp/search?query='
            };
            const base = engines[engine] || engines.ddg;
            return base + encodeURIComponent(query);
        }
    };
});
