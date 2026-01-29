declare module 'node-osc' {
  export class Server {
    constructor(port: number, host?: string);
    on(event: 'listening', callback: () => void): void;
    on(event: 'message', callback: (msg: any[], rinfo?: any) => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    close(): void;
  }

  export class Client {
    constructor(host: string, port: number);
    send(message: Message, callback?: (error?: Error) => void): void;
    close(): void;
  }

  export class Message {
    constructor(address: string);
    append(arg: any): void;
  }
}
