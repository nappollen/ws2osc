# WS2OSC Bridge

WebSocket to OSC bridge with OSCQuery support.

## Features

- WebSocket server for bidirectional communication
- OSC UDP server and client
- OSCQuery discovery and service management
- Web interface for viewing discovered services and parameters
- Real-time parameter updates
- Time broadcasting to all discovered services

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

### Build TypeScript to JavaScript

```bash
npm run build
```

### Build standalone executables for all platforms

```bash
npm run build:all
```

This will create executables in the `build/` directory:
- `ws2osc-linux` - Linux x64
- `ws2osc-macos` - macOS x64
- `ws2osc-win.exe` - Windows x64

### Build for specific platforms

```bash
# Windows only
npm run caxa:win

# Linux only
npm run caxa:linux

# macOS only
npm run caxa:mac
```

## Running

### Development mode
```bash
npm run dev
```

### Production mode (with Node.js)
```bash
npm run build
npm start
```

### Standalone executable

The executables include Node.js and all dependencies. Simply run them directly:

```bash
# Windows
build\ws2osc-win.exe

# Linux
./build/ws2osc-linux

# macOS
./build/ws2osc-macos
```

**Note**: Executables are packaged using [caxa](https://github.com/leafac/caxa), which bundles the application with Node.js and node_modules. First run may take a moment to extract.


## Ports

- WebSocket: 58942
- OSC: Auto-detected
- OSCQuery: 3000

## License

ISC
