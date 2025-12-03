// BareMux Worker - Simplified version
console.log('BareMux Worker loaded');

class BareMuxWorker {
    constructor() {
        this.transport = null;
        this.clients = new Map();
        this.nextClientId = 1;
        
        self.addEventListener('message', this.handleMessage.bind(this));
        console.log('BareMux Worker initialized');
    }
    
    handleMessage(event) {
        const { data, ports } = event;
        
        if (data.type === 'set') {
            this.handleSetTransport(data, ports);
        } else if (data.type === 'get') {
            this.handleGetTransport(event);
        } else if (data.type === 'fetch') {
            this.handleFetch(data, ports);
        } else if (data.type === 'websocket') {
            this.handleWebSocket(data, ports);
        } else if (data.type === 'ping') {
            this.handlePing(event, ports);
        }
    }
    
    handleSetTransport(data, ports) {
        console.log('Setting transport:', data.client.function);
        
        this.transport = {
            name: data.client.function,
            args: data.client.args
        };
        
        // Send success response
        if (ports && ports[0]) {
            ports[0].postMessage({ type: 'set', success: true });
        }
    }
    
    handleGetTransport(event) {
        console.log('Getting transport');
        
        event.ports[0].postMessage({
            type: 'get',
            name: this.transport?.name || 'none'
        });
    }
    
    async handleFetch(data, ports) {
        console.log('Fetch request:', data.fetch.remote);
        
        try {
            // Simplified fetch through transport
            const response = await this.fetchThroughTransport(data.fetch);
            
            if (ports && ports[0]) {
                ports[0].postMessage({
                    type: 'fetch',
                    fetch: response
                }, response.body ? [response.body] : []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            
            if (ports && ports[0]) {
                ports[0].postMessage({
                    type: 'error',
                    error: error.message
                });
            }
        }
    }
    
    async fetchThroughTransport(request) {
        // Mock transport fetch - in reality this would use the configured transport
        const mockResponse = {
            status: 200,
            statusText: 'OK',
            headers: {
                'content-type': 'text/html; charset=utf-8',
                'cache-control': 'no-cache'
            },
            body: new ReadableStream()
        };
        
        return mockResponse;
    }
    
    handleWebSocket(data, ports) {
        console.log('WebSocket request:', data.websocket.url);
        
        // Mock WebSocket connection
        const channel = ports?.[0];
        if (channel) {
            // Simulate connection
            setTimeout(() => {
                channel.postMessage({
                    type: 'open',
                    args: ['mock-protocol']
                });
            }, 100);
        }
    }
    
    handlePing(event, ports) {
        console.log('Ping received');
        
        if (ports && ports[0]) {
            ports[0].postMessage({ type: 'pong' });
        }
    }
}

// Initialize worker
new BareMuxWorker();