import { WebSocketServer, WebSocket } from 'ws';
import { getFreePort } from './utils/network';
import EventEmitter from 'events';

export class WSServer extends EventEmitter {
    private wss: WebSocketServer | null = null;
    private clients: Set<WebSocket> = new Set();
    private port: number;

    constructor(port?: number) {
        super();
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
                    this.clients.add(ws);
                    this.emit('connect', ws);

                    ws.on('message', (data: Buffer) => {
                        this.emit('message', data, ws);
                    });

                    ws.on('close', () => {
                        console.log('Client disconnected');
                        this.clients.delete(ws);
                        this.emit('disconnect', ws);
                    });
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

    send(ws: WebSocket, data: any): void {
        if (ws.readyState !== WebSocket.OPEN) return;
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        ws.send(message);
    }
}
