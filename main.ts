import { WSServer } from './src/ws';
import { OSCServer } from './src/osc';
import { OSCQueryServer } from './src/oscquery';
import { DiscoveredService, OSCMethodDescription, OSCQAccess } from 'oscquery';
import { WebSocket } from 'ws';
import { getFreePort } from './src/utils/network.js';

async function main() {
    // Initialiser les serveurs
    const wsPort = 58942;
    const oscPort = 9015 // await getFreePort(); // Auto-detect port
    const oscQueryPort = await getFreePort(); // Auto-detect port

    const wsServer = new WSServer(wsPort);
    const oscServer = new OSCServer(oscPort);

    try {
        // Démarrer les serveurs
        await oscServer.start();
        const actualOscPort = oscServer.getPort();

        const oscQueryServer = new OSCQueryServer(
            oscQueryPort,
            '127.0.0.1',
            actualOscPort,
            wsServer
        );
        await oscQueryServer.start();

        await wsServer.start();

        console.log('\n=== WS2OSC Bridge Started ===');
        console.log(`WebSocket server: ws://localhost:${wsPort}`);
        console.log(`OSC server: UDP port ${actualOscPort}`);
        console.log(`OSCQuery server: http://localhost:${oscQueryPort}`);
        console.log('============================\n');

        wsServer.on('connect', async ws => wsServer.send(ws, {
            type: 'server_info',
            services: oscQueryServer.getServices().map((service, index) => ({
                index: index,
                address: service.address,
                query: service.port,
                name: service.hostInfo?.name || 'unknown',
                osc: service.hostInfo?.oscPort || 0,
            })),
            details: {
                ws: wsPort,
                osc: actualOscPort,
                query: oscQueryPort
            }
        }));

        // Pont: WebSocket -> OSC
        // Format attendu: { address: "/test", args: [1, 2, "hello"] }
        wsServer.on('message', async (data, ws) => {
            if (data.type === 'get_parameters') {
                // Request to get service parameters
                try {
                    const services = oscQueryServer.getServices();
                    const service = services[data.index];

                    if (!service) {
                        wsServer.send(ws, {
                            type: 'service_parameters',
                            error: 'Service not found'
                        });
                        return;
                    }

                    // Get parameters from cached data
                    const parameters = oscQueryServer.getServiceParameters(data.index);
                    sendParameters(ws, wsServer, data.index, service, parameters);
                } catch (error: any) {
                    console.error('Error fetching parameters:', error);
                    wsServer.send(ws, {
                        type: 'service_parameters',
                        error: `Failed to fetch parameters: ${error.message}`
                    });
                }
            } else if (data.type === 'update_parameters') {

                const services = oscQueryServer.getServices();
                const service = services[data.index];

                if (!service) {
                    wsServer.send(ws, {
                        type: 'service_parameters',
                        error: 'Service not found'
                    });
                    return;
                }

                // Update parameters
                const parameters = await oscQueryServer.updateServiceParameters(data.index);
                sendParameters(ws, wsServer, data.index, service, parameters);
            } else if (data.type === 'send_osc') {
                // OSC message to send
                oscServer.sendTo(data.path, data.args, data.host, data.port);
            }
        });

        // Pont: OSC -> WebSocket
        oscServer.on('message', (path, args, host, port) => wsServer.broadcast({
            type: 'receive_osc',
            path: path,
            args: args,
            host: host,
            port: port
        }));

        // Gestion de l'arrêt propre
        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            wsServer.stop();
            oscServer.stop();
            oscQueryServer.stop();
            process.exit(0);
        });

    } catch (error) {
        console.error('Error starting servers:', error);
        process.exit(1);
    }
}

function sendParameters(ws: WebSocket, srv: WSServer, index: number, service: DiscoveredService, parameters: OSCMethodDescription[] | null) {
    if (!parameters) {
        srv.send(ws, {
            type: 'service_parameters',
            error: 'No parameters available'
        });
        return;
    }

    const ACCESS = Object.entries({
        READONLY: 1,
        WRITEONLY: 2,
        READWRITE: 3,
        NA: 0,
        R: 1,
        W: 2,
        RW: 3
    });


    srv.send(ws, {
        type: 'service_parameters',
        service: {
            index: index,
            address: service.address,
            query: service.port,
            name: service.hostInfo?.name || 'unknown',
            osc: service.hostInfo?.oscPort || 0,
        },
        parameters: parameters.map(param => ({
            path: param.full_path,
            access: ACCESS.find(([_, value]) => value === param.access)?.[0] || 'NO_VALUE',
            arguments: param.arguments || [],
        }))
    });
}

main();
