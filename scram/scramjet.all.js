// Mock Scramjet All module
console.log('Scramjet.all.js loaded (mock)');

// Mock $scramjetLoadController function
window.$scramjetLoadController = function() {
    console.log('Scramjet controller loader called');
    
    return {
        ScramjetController: class MockScramjetController {
            constructor(config) {
                console.log('Mock ScramjetController created with config:', config);
                this.config = config;
                this.initialized = false;
            }
            
            async init() {
                console.log('Mock ScramjetController initialized');
                this.initialized = true;
                return this;
            }
            
            encodeUrl(url) {
                console.log('Mock encoding URL:', url);
                // Create a fake Scramjet-style encoded URL
                try {
                    const urlObj = new URL(url);
                    const encoded = btoa(url);
                    return `/scramjet/${encoded}`;
                } catch (error) {
                    const encoded = btoa('https://' + url);
                    return `/scramjet/${encoded}`;
                }
            }
        }
    };
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { $scramjetLoadController: window.$scramjetLoadController };
}
