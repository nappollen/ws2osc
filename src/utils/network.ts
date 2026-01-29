import * as net from 'net';

export async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const port = address.port;
        server.close(() => {
          console.log(`Found available port: ${port}`);
          resolve(port);
        });
      } else {
        server.close();
        reject(new Error('Failed to get port from server'));
      }
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}
