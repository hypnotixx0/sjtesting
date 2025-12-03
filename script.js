// Scramjet-style Proxy Implementation
class ScramjetProxy {
    constructor() {
        this.scramjet = null;
        this.bareMux = null;
        this.currentUrl = '';
        this.isInitialized = false;
        
        // DOM Elements
        this.elements = {
            urlInput: document.getElementById('url-input'),
            loadBtn: document.getElementById('load-btn'),
            proxyFrame: document.getElementById('proxy-frame'),
            loading: document.getElementById('loading'),
            loadingText: document.getElementById('loading-text'),
            error: document.getElementById('error'),
            errorMessage: document.getElementById('error-message'),
            proxyStatus: document.getElementById('proxy-status'),
            proxyMode: document.getElementById('proxy-mode'),
            transportStatus: document.getElementById('transport-status'),
            loadTime: document.getElementById('load-time'),
            debugLogs: document.getElementById('debug-logs')
        };
        
        this.init();
    }
    
    async init() {
        this.log('Starting Scramjet proxy initialization...');
        
        try {
            // Wait for Scramjet scripts to load
            await this.waitForScramjet();
            
            // Initialize Scramjet controller
            this.scramjet = new ScramjetController({
                files: {
                    wasm: "/scram/scramjet.wasm.wasm",
                    all: "/scram/scramjet.all.js",
                    sync: "/scram/scramjet.sync.js",
                },
            });
            
            await this.scramjet.init();
            window.scramjet = this.scramjet;
            this.log('✓ Scramjet controller initialized');
            
            // Initialize BareMux connection
            await this.initBareMux();
            
            // Register service worker
            await this.registerServiceWorker();
            
            this.isInitialized = true;
            this.updateStatus('Ready');
            this.log('✓ Proxy system fully initialized');
            
            // Auto-load Cookie Clicker
            setTimeout(() => this.loadPreset('https://orteil.dashnet.org/cookieclicker/'), 500);
            
        } catch (error) {
            this.showError(`Initialization failed: ${error.message}`);
            this.log(`✗ Initialization error: ${error.message}`, 'error');
            
            // Fallback to simple proxy
            setTimeout(() => this.enableFallbackMode(), 1000);
        }
    }
    
    async waitForScramjet() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const check = () => {
                attempts++;
                if (window.ScramjetController) {
                    resolve();
                } else if (attempts < 30) { // Wait up to 3 seconds
                    setTimeout(check, 100);
                } else {
                    reject(new Error('Scramjet scripts failed to load'));
                }
            };
            check();
        });
    }
    
    async initBareMux() {
        try {
            this.bareMux = new BareMux.BareMuxConnection("/baremux/worker.js");
            
            // Configure WISP transport
            const wispUrl = (location.protocol === "https:" ? "wss" : "ws") +
                "://" + location.host + "/wisp/";
            
            const currentTransport = await this.bareMux.getTransport();
            this.log(`Current transport: ${currentTransport}`);
            
            if (currentTransport !== "/epoxy/index.mjs") {
                await this.bareMux.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                this.log('✓ WISP transport configured');
            }
            
            this.elements.transportStatus.textContent = 'WISP (WebSocket)';
            
        } catch (error) {
            this.log(`BareMux error: ${error.message}`, 'warn');
            this.elements.transportStatus.textContent = 'Failed - Using fallback';
        }
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                this.log(`✓ Service Worker registered: ${registration.scope}`);
                
                // Send port to service worker
                if (this.bareMux && registration.active) {
                    const port = this.bareMux.getInnerPort();
                    if (port) {
                        registration.active.postMessage({
                            type: "getPort",
                            port: port
                        }, [port]);
                        this.log('✓ Port sent to Service Worker');
                    }
                }
            } catch (error) {
                this.log(`Service Worker registration failed: ${error.message}`, 'warn');
            }
        }
    }
    
    setupEventListeners() {
        // Load button
        this.elements.loadBtn.addEventListener('click', () => this.loadUrl());
        
        // Enter key in URL input
        this.elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadUrl();
        });
        
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                this.loadPreset(url);
            });
        });
        
        // Control buttons
        document.getElementById('reload-btn').addEventListener('click', () => this.reload());
        document.getElementById('devtools-btn').addEventListener('click', () => this.openDevTools());
        document.getElementById('retry-btn').addEventListener('click', () => this.retry());
        document.getElementById('simple-proxy-btn').addEventListener('click', () => this.enableSimpleProxy());
        
        // Iframe events
        this.elements.proxyFrame.addEventListener('load', () => {
            this.hideLoading();
            this.log(`✓ Page loaded: ${this.currentUrl}`);
            this.updateLoadTime();
        });
        
        this.elements.proxyFrame.addEventListener('error', () => {
            this.hideLoading();
            this.showError('Frame failed to load content');
        });
    }
    
    async loadUrl() {
        let url = this.elements.urlInput.value.trim();
        
        if (!url) {
            this.showError('Please enter a URL');
            return;
        }
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
            this.elements.urlInput.value = url;
        }
        
        this.currentUrl = url;
        this.showLoading(`Loading ${new URL(url).hostname}...`);
        this.updateStatus('Loading...');
        
        try {
            if (this.isInitialized && this.scramjet) {
                await this.loadViaScramjet(url);
            } else {
                await this.loadViaSimpleProxy(url);
            }
        } catch (error) {
            this.hideLoading();
            this.showError(`Failed to load: ${error.message}`);
            this.log(`✗ Load failed: ${error.message}`, 'error');
        }
    }
    
    loadPreset(url) {
        this.elements.urlInput.value = url;
        this.loadUrl();
    }
    
    async loadViaScramjet(url) {
        try {
            // Encode URL through Scramjet (like the original code)
            const encodedUrl = this.scramjet.encodeUrl(url);
            this.log(`Encoding URL via Scramjet: ${encodedUrl}`);
            
            this.elements.proxyFrame.src = encodedUrl;
            this.elements.proxyMode.textContent = 'Scramjet Proxy';
            
        } catch (error) {
            throw new Error(`Scramjet encoding failed: ${error.message}`);
        }
    }
    
    async loadViaSimpleProxy(url) {
        // Fallback to CORS proxy
        this.log('Using simple CORS proxy fallback');
        
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const html = await response.text();
            
            // Basic URL rewriting
            const processedHtml = this.rewriteHTML(html, url);
            
            // Create blob URL
            const blob = new Blob([processedHtml], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            this.elements.proxyFrame.src = blobUrl;
            this.elements.proxyMode.textContent = 'CORS Proxy Fallback';
            
        } catch (error) {
            // Last resort: direct load
            this.log('Falling back to direct load');
            this.elements.proxyFrame.src = url;
            this.elements.proxyMode.textContent = 'Direct Load';
        }
    }
    
    rewriteHTML(html, baseUrl) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const base = new URL(baseUrl);
            
            // Add base tag
            const baseTag = doc.createElement('base');
            baseTag.href = baseUrl;
            doc.head.prepend(baseTag);
            
            // Helper to make URLs absolute
            const makeAbsolute = (url) => {
                if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
                try {
                    return new URL(url, base).href;
                } catch {
                    return url;
                }
            };
            
            // Rewrite common resource URLs
            ['src', 'href'].forEach(attr => {
                doc.querySelectorAll(`[${attr}]`).forEach(el => {
                    const value = el.getAttribute(attr);
                    if (value) {
                        const absolute = makeAbsolute(value);
                        if (absolute !== value) {
                            el.setAttribute(attr, absolute);
                        }
                    }
                });
            });
            
            return doc.documentElement.outerHTML;
        } catch {
            return html; // Return original if parsing fails
        }
    }
    
    reload() {
        if (this.elements.proxyFrame.src && this.elements.proxyFrame.src !== 'about:blank') {
            this.elements.proxyFrame.src = this.elements.proxyFrame.src;
            this.showLoading('Reloading...');
            this.log('↻ Reloading page');
        }
    }
    
    openDevTools() {
        try {
            const iframeWindow = this.elements.proxyFrame.contentWindow;
            iframeWindow.console.log('DevTools accessed from proxy');
            // Note: Actual devtools access requires same-origin
            this.log('DevTools access attempted (may require same-origin)');
        } catch (error) {
            this.log('Cannot access iframe devtools due to CORS', 'warn');
        }
    }
    
    retry() {
        this.hideError();
        if (this.currentUrl) {
            this.loadUrl();
        }
    }
    
    enableSimpleProxy() {
        this.hideError();
        this.isInitialized = false;
        this.elements.proxyMode.textContent = 'Simple Proxy Mode';
        this.log('Switched to simple proxy mode');
        if (this.currentUrl) {
            this.loadViaSimpleProxy(this.currentUrl);
        }
    }
    
    enableFallbackMode() {
        this.isInitialized = false;
        this.elements.proxyStatus.textContent = 'Fallback Mode';
        this.elements.proxyMode.textContent = 'Simple Proxy';
        this.elements.transportStatus.textContent = 'Direct Fetch';
        this.log('Enabled fallback proxy mode');
        this.showLoading('Using fallback proxy...');
    }
    
    showLoading(message = 'Loading...') {
        this.elements.loadingText.textContent = message;
        this.elements.loading.style.display = 'flex';
        this.elements.error.style.display = 'none';
        this.elements.proxyFrame.style.display = 'none';
    }
    
    hideLoading() {
        this.elements.loading.style.display = 'none';
        this.elements.proxyFrame.style.display = 'block';
    }
    
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.error.style.display = 'flex';
        this.elements.loading.style.display = 'none';
        this.updateStatus('Error');
    }
    
    hideError() {
        this.elements.error.style.display = 'none';
    }
    
    updateStatus(status) {
        this.elements.proxyStatus.textContent = status;
    }
    
    updateLoadTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        this.elements.loadTime.textContent = timeString;
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
        logEntry.textContent = `[${timeString}] ${message}`;
        
        this.elements.debugLogs.appendChild(logEntry);
        this.elements.debugLogs.scrollTop = this.elements.debugLogs.scrollHeight;
        
        console.log(`[ScramjetProxy] ${message}`);
    }
}

// Initialize when everything is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners first
    const proxy = new ScramjetProxy();
    proxy.setupEventListeners();
    window.scramjetProxy = proxy;
    
    // Helper functions from original Scramjet code
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
    
    // Search function from original code
    window.search = function(query, engine = 'ddg') {
        if (query.trim() === '') return '';
        
        try {
            new URL(query);
            return query;
        } catch {
            // Not a valid URL, treat as search
            const searchEngines = {
                google: 'https://www.google.com/search?q=',
                bing: 'https://www.bing.com/search?q=',
                ddg: 'https://duckduckgo.com/?q=',
                yahoo: 'https://search.yahoo.com/search?p=',
                brave: 'https://search.brave.com/search?q=',
                startpage: 'https://www.startpage.com/sp/search?query='
            };
            
            const base = searchEngines[engine] || searchEngines.ddg;
            return base + encodeURIComponent(query);
        }
    };
});
