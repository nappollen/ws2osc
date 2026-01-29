import { WebSocketServer, WebSocket } from 'ws';
import { getFreePort } from './utils/network';

export class WSServer {
    private wss: WebSocketServer | null = null;
    private clients: Set<WebSocket> = new Set();
    private onMessageCallback?: (data: any, ws: WebSocket) => void;
    private port: number;

    constructor(port?: number) {
        this.port = port || 0;
    }

    async start(): Promise<void> {
        // Si pas de port spécifié, trouver un port disponible
        if (this.port === 0) {
            this.port = await getFreePort();
        }

        return new Promise((resolve, reject) => {
            try {
                this.wss = new WebSocketServer({ port: this.port });

                this.wss.on('listening', () => {
                    console.log(`WebSocket server listening on port ${this.port}`);
                    resolve();
                });

                this.wss.on('connection', (ws: WebSocket) => {
                    console.log('New WebSocket client connected');
                    this.clients.add(ws);

                    ws.on('message', (data: Buffer) => {
                        if (this.onMessageCallback) {
                            try {
                                const message = JSON.parse(data.toString());
                                this.onMessageCallback(message, ws);
                            } catch (error) {
                                console.error('Error parsing WS message:', error);
                            }
                        }
                    });

                    ws.on('close', () => {
                        console.log('Client disconnected');
                        this.clients.delete(ws);
                    });

                    ws.on('error', (error) => {
                        console.error('WebSocket error:', error);
                    });
                });

                this.wss.on('error', (error) => {
                    console.error('WebSocket server error:', error);
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    broadcast(data: any): void {
        const message = typeof data === 'string'
            ? data
            : JSON.stringify(data);
        for (var client of this.clients)
            if (client.readyState === WebSocket.OPEN)
                client.send(message);
    }

    stop(): void {
        if (!this.wss) return;
        for (var client of this.clients)
            client.close();
        this.clients.clear();
        this.wss.close();
        console.log('WebSocket server stopped');
    }

    count(): number {
        return this.clients.size;
    }

    onMessage(callback: (data: any, ws: WebSocket) => void): void {
        this.onMessageCallback = callback;
    }

    send(ws: WebSocket, data: any): void {
        if (ws.readyState !== WebSocket.OPEN) return;
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        ws.send(message);
    }
}
