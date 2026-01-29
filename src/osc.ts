import * as osc from 'node-osc';
import { getFreePort } from './utils/network';

export class OSCServer {
  private oscServer: osc.Server | null = null;
  private oscClient: osc.Client | null = null;
  private port: number;
  private onMessageCallback?: (address: string, args: any[], host: string, port: number) => void;

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
        this.oscServer = new osc.Server(this.port, '127.0.0.1'); // Bind sur localhost au lieu de 0.0.0.0

        this.oscServer.on('listening', () => {
          console.log(`OSC server listening on port ${this.port}`);
          resolve();
        });

        this.oscServer.on('message', (msg: any[], rinfo: any) => {
          if (this.onMessageCallback && msg.length > 0) {
            const address = msg[0];
            const args = msg.slice(1);
            const host = rinfo?.address || 'unknown';
            const port = rinfo?.port || 0;
            this.onMessageCallback(address, args, host, port);
          }
        });

        this.oscServer.on('error', (error: Error) => {
          console.error('OSC server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  sendTo(address: string, args: any[], host: string, port: number): void {
    try {
      const client = new osc.Client(host, port);
      
      // node-osc expects a Message with address and args array
      const message = new osc.Message(address);
      if (args && args.length > 0) {
        args.forEach(arg => message.append(arg));
      }
      
      client.send(message, (error?: Error) => {
        if (error) {
          console.error('Error sending OSC message:', error);
        }
        client.close();
      });
    } catch (error) {
      console.error('Error sending OSC message:', error);
    }
  }

  stop(): void {
    if (this.oscServer) {
      this.oscServer.close();
      console.log('OSC server stopped');
    }
    if (this.oscClient) {
      this.oscClient.close();
    }
  }

  getPort(): number {
    return this.port;
  }

  onMessage(callback: (address: string, args: any[], host: string, port: number) => void): void {
    this.onMessageCallback = callback;
  }
}
