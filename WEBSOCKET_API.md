# WebSocket API Documentation

WebSocket endpoint: `ws://localhost:58942`

## Messages from Client to Server

### 1. Get Service Parameters

Request the OSCQuery parameters for a specific discovered service.

**Client → Server**
```json
{
  "type": "get_parameters",
  "index": 0
}
```

**Fields:**
- `type`: `"get_parameters"`
- `index`: Index of the service in the services array

**Response:** See [Service Parameters Response](#service-parameters-response)

---

### 2. Update Service Parameters

Force an update of the cached parameters for a specific service.

**Client → Server**
```json
{
  "type": "update_parameters",
  "index": 0
}
```

**Fields:**
- `type`: `"update_parameters"`
- `index`: Index of the service to update

**Response:** See [Service Parameters Response](#service-parameters-response)

---

### 3. Send OSC Message

Send an OSC message to a specific host and port.

**Client → Server**
```json
{
  "type": "send_osc",
  "path": "/avatar/parameters/test",
  "args": [1, 2.5, "hello"],
  "host": "127.0.0.1",
  "port": 9000
}
```

**Fields:**
- `type`: `"send_osc"`
- `path`: OSC address path (string)
- `args`: Array of arguments (numbers, strings, booleans)
- `host`: Target IP address (string)
- `port`: Target OSC UDP port (number)

**Response:** None (fire and forget)

---

## Messages from Server to Client

### 1. Server Info (Broadcast)

Sent automatically every 1 second to all connected clients with current server status and discovered services.

**Server → Client**
```json
{
  "type": "server_info",
  "services": [
    {
      "index": 0,
      "address": "127.0.0.1",
      "query": 49899,
      "name": "VRChat-Client-453020",
      "osc": 9000
    }
  ],
  "details": {
    "ws": 58942,
    "osc": 57121,
    "query": 3000
  }
}
```

**Fields:**
- `type`: `"server_info"`
- `services`: Array of discovered OSCQuery services
  - `index`: Service index for references in other requests
  - `address`: Service IP address
  - `query`: Service OSCQuery HTTP port
  - `name`: Service display name
  - `osc`: Service OSC UDP port
- `details`: Bridge server information
  - `ws`: WebSocket server port
  - `osc`: Bridge OSC server port
  - `query`: Bridge OSCQuery server port

---

### 2. Service Parameters Response

Response to `get_parameters` or `update_parameters` requests.

#### Success Response

**Server → Client**
```json
{
  "type": "service_parameters",
  "service": {
    "index": 0,
    "address": "127.0.0.1",
    "query": 49899,
    "name": "VRChat-Client-453020",
    "osc": 9000
  },
  "parameters": [
    {
      "path": "/avatar/parameters/VelocityX",
      "access": "READWRITE",
      "arguments": [
        {
          "type": "f",
          "value": 0.0
        }
      ]
    },
    {
      "path": "/tracking/trackers/1/position",
      "access": "WRITEONLY",
      "arguments": [
        { "type": "f" },
        { "type": "f" },
        { "type": "f" }
      ]
    }
  ]
}
```

**Fields:**
- `type`: `"service_parameters"`
- `service`: Service information object
  - `index`: Service index
  - `address`: Service IP
  - `query`: OSCQuery port
  - `name`: Service name
  - `osc`: OSC port
- `parameters`: Array of OSC parameter definitions
  - `path`: OSC address path
  - `access`: Access mode (`"READONLY"`, `"WRITEONLY"`, `"READWRITE"`, `"NO_VALUE"`)
  - `arguments`: Array of argument descriptors
    - `type`: OSC type tag (`"f"` float, `"i"` int, `"s"` string, `"T"` true, `"F"` false, `"b"` blob)
    - `value`: Current value (optional, may be null)

#### Error Response

**Server → Client**
```json
{
  "type": "service_parameters",
  "error": "Service not found"
}
```

**Fields:**
- `type`: `"service_parameters"`
- `error`: Error message string

---

### 3. Service Up (Event)

Broadcast when a new OSCQuery service is discovered on the network.

**Server → Client**
```json
{
  "type": "service_up",
  "service": {
    "address": "127.0.0.1",
    "query": 49899,
    "name": "VRChat-Client-453020",
    "osc": 9000
  }
}
```

**Fields:**
- `type`: `"service_up"`
- `service`: Newly discovered service information
  - `address`: Service IP
  - `query`: OSCQuery port
  - `name`: Service name
  - `osc`: OSC port

---

### 4. Service Down (Event)

Broadcast when a previously discovered OSCQuery service goes offline.

**Server → Client**
```json
{
  "type": "service_down",
  "service": {
    "address": "127.0.0.1",
    "query": 49899,
    "name": "VRChat-Client-453020",
    "osc": 9000
  }
}
```

**Fields:**
- `type`: `"service_down"`
- `service`: Service that went offline
  - `address`: Service IP
  - `query`: OSCQuery port
  - `name`: Service name
  - `osc`: OSC port

---

### 5. Receive OSC Message

Broadcast when the bridge receives an OSC message on its OSC server port.

**Server → Client**
```json
{
  "type": "receive_osc",
  "path": "/avatar/parameters/VelocityX",
  "args": [1.5],
  "host": "127.0.0.1",
  "port": 9000
}
```

**Fields:**
- `type`: `"receive_osc"`
- `path`: OSC address path that was received
- `args`: Array of arguments from the OSC message
- `host`: IP address of the sender
- `port`: Port number of the sender

---

## Message Flow Examples

### Example 1: Discovering and Viewing Service Parameters

1. **Client connects** to `ws://localhost:58942`
2. **Server broadcasts** `server_info` every 1s with list of services
3. **Client requests** parameteindex": 0}
   ```
4. **Server responds** with `service_parameters` containing all OSC paths
5. **Client can update** parameters later:
   ```json
   {"type": "update_parameters", "index": 0}
   ```

### Example 2: Sending OSC Messages

**Client sends** time data to VRChat:
```json
{
  "type": "send_osc",
  "path
  "type": "send_osc",
  "address": "/time/hours",
  "args": [14],
  "host": "127.0.0.1",
  "port": 9000
}
```

### Example 3: Service Discovery Events

1. New VRChat instance starts
2. **Server broadcasts** `service_up` to all clients
3. Clients update their UI to show new service
4. VRChat closes
5. **Server broadcasts** `service_down` to all clients
6. Clients remove service from UI

---

## OSC Type Tags Reference

| Type | Description | Example Value |
|------|-------------|---------------|
| `f` | Float (32-bit) | 1.5, -3.14 |
| `i` | Integer (32-bit) | 42, -10 |
| `s` | String | "hello" |
| `T` | Boolean True | true |
| `F` | Boolean False | false |
| `b` | Blob (binary data) | (buffer) |

---

## Connection Example (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:58942');

ws.onopen = () => {
    console.log('Connected to WS2OSC Bridge');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'server_info':
            console.log('Services:', data.services);
            break;
            
        case 'service_parameters':
            console.log('Parameters:', data.parameters);
            break;
            
        case 'service_up':
            console.log('New service:', data.service.name);
            break;
            
        case 'service_down':
            console.log('Service offline:', data.service.name);
        case 'receive_osc':
            console.log('OSC received:', data.path, data.args, 'from', data.host + ':' + data.port);
            break;
            
        default:
            console.log('Unknown message:', data);
    }
};

// Request parameters for first service
ws.send(JSON.stringify({
    type: 'get_parameters',
    index: 0
}));

// Send OSC message
ws.send(JSON.stringify({
    type: 'send_osc',
    pathN.stringify({
    type: 'send_osc',
    address: '/test',
    args: [123, 'hello'],
    host: '127.0.0.1',
    port: 9000
}));
```
