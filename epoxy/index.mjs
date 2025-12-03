// Epoxy Transport Module
console.log('Epoxy transport module loaded');

export default class EpoxyTransport {
    constructor(config) {
        this.config = config;
        this.wispUrl = config?.wisp || 'ws://localhost:8080/wisp/';
        this.ready = false;
    }
    
    async init() {
        console.log('Initializing Epoxy transport with WISP:', this.wispUrl);
        
        // Mock initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        this.ready = true;
        
        return this;
    }
    
    async request(url, method, body, headers, signal) {
        console.log('Epoxy request:', { url, method });
        
        // Mock request
        return {
            status: 200,
            statusText: 'OK',
            headers: {
                'content-type': 'text/html; charset=utf-8'
            },
            body: new ReadableStream()
        };
    }
    
    connect(url, protocols, requestHeaders, onOpen, onMessage, onClose, onError) {
        console.log('Epoxy WebSocket connect:', url);
        
        // Mock WebSocket connection
        setTimeout(() => {
            onOpen('mock-protocol');
        }, 100);
        
        // Return mock control functions
        return [
            (data) => {
                console.log('Sending data:', data);
            },
            (code, reason) => {
                console.log('Closing connection:', code, reason);
                setTimeout(() => {
                    onClose(code, reason);
                }, 50);
            }
        ];
    }
}