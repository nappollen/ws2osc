import { Server, Client, ArgumentType, RequestInfo, Message } from 'node-osc';
import EventEmitter from 'events';

export class OSCServer extends EventEmitter {
  private server: Server | null = null;
  private port: number;

  constructor(port?: number) {
    super();
    this.port = port || 0;
  }

  async start(): Promise<void> {
    // Si pas de port spécifié, trouver un port disponible
    return new Promise((resolve, reject) => {
      try {
        this.server = new Server(this.port, '0.0.0.0');

        this.server.on('listening', () => {
          console.log(`OSC server listening on port ${this.port}`);
          resolve();
        });

        this.server.on('message', (message: [string, ...ArgumentType[]], rinfo: RequestInfo) => {
          if (message.length <= 0) return;
          const address = message[0];
          const args = message.slice(1);
          const host = rinfo?.address || 'unknown';
          const port = rinfo?.port || 0;
          this.emit('message', address, args, host, port);
        });

        this.server.on('error', (error: Error) => {
          console.error('OSC server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async sendTo(address: string, args: ArgumentType[], host: string, port: number): Promise<void> {
    const client = new Client(host, port);
    try {
      const message = new Message(address, ...args);
      client.send(message);
    } catch (error) {
      console.error('Error sending OSC message:', error);
    } finally {
      client.close();
    }
  }

  stop(): void {
    this.server?.close();
    console.log('OSC server stopped');
  }

  getPort(): number {
    return this.port;
  }
}
