import { randomBytes } from 'crypto';
import { OSCQueryServer as OSCQuery, OSCQueryDiscovery, OSCTypeSimple, OSCQAccess, DiscoveredService, OSCMethodDescription } from 'oscquery';
import { WSServer } from './ws';

export class OSCQueryServer {
    private server: OSCQuery;
    private discovery: OSCQueryDiscovery;
    private port: number;
    private oscPort: number;
    private services: DiscoveredService[] = [];
    private wsServer?: WSServer;

    constructor(port?: number, oscIp: string = '127.0.0.1', oscPort: number = 9000, wsServer?: WSServer) {
        this.oscPort = oscPort;
        this.wsServer = wsServer;
        let e = 'ws2osc_' + randomBytes(4).toString('hex');
        this.server = new OSCQuery({
            httpPort: port,
            oscPort: this.oscPort,
            oscIp: oscIp,
            serviceName: e,
            oscQueryHostName: e
        });
        this.port = port || 0; // Will be set after start()
        this.discovery = new OSCQueryDiscovery();
        this.setupDiscovery();
    }

    private setupDiscovery(): void {
        this.discovery.on('up', (service: DiscoveredService) => {
            console.log('Service discovered:', service.address, service.port);

            if (this.services.find(s => s.address === service.address && s.port === service.port)) return;
            if (service.port === this.port && service.address === '127.0.0.1') return;

            this.services.push(service);

            // Broadcast service up event to WebSocket clients
            if (this.wsServer) {
                this.wsServer.broadcast({
                    type: 'service_up',
                    service: {
                        address: service.address,
                        query: service.port,
                        name: service.hostInfo?.name || 'unknown',
                        osc: service.hostInfo?.oscPort || 0,
                    }
                });
            }
        });

        this.discovery.on('down', (service: DiscoveredService) => {
            console.log('Service down:', service.address);
            this.services = this.services
                .filter(s => s.address !== service.address || s.port !== service.port);

            // Broadcast service down event to WebSocket clients
            if (this.wsServer) {
                this.wsServer.broadcast({
                    type: 'service_down',
                    service: {
                        address: service.address,
                        query: service.port,
                        name: service.hostInfo?.name || 'unknown',
                        osc: service.hostInfo?.oscPort || 0,
                    }
                });
            }
        });
    }

    async start(): Promise<void> {
        const hostInfo = await this.server.start();
        this.port = hostInfo.wsPort || 0; // Get actual HTTP port
        console.log(`OSCQuery server listening on port ${hostInfo.wsPort}`);

        this.server.addMethod('/', { access: OSCQAccess.READWRITE });
        
        // Start discovery
        this.discovery.start();
        console.log('OSCQuery discovery started');
    }

    stop(): void {
        this.discovery.stop();
        this.server.stop();
        console.log('OSCQuery server stopped');
    }

    getServiceParameters(index: number): OSCMethodDescription[] | null {
        const service = this.services[index];
        if (!service) return null;
        return service.flat();
    }

    async updateServiceParameters(index: number): Promise<OSCMethodDescription[] | null> {
        const service = this.services[index];
        if (!service) return null;
        await service.update();
        return service.flat();
    }

    getPort(): number {
        return this.port;
    }

    setOSCPort(port: number): void {
        this.oscPort = port;
    }

    getServices(): DiscoveredService[] {
        return this.services;
    }
}
