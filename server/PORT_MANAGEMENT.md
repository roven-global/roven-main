# Port Management Solution

This solution provides automatic port detection and management for the Node.js server to prevent `EADDRINUSE` errors.

## Features

1. **Automatic Port Detection**: Server automatically finds the next available port if the default port is busy
2. **Port Management Scripts**: Command-line tools to find available ports and kill processes
3. **Safe Startup**: Option to automatically kill processes on the default port before starting

## How It Works

### Automatic Port Detection

The server now includes a `findAvailablePort()` function that:

- Starts checking from the default port (5000)
- If the port is busy, automatically tries the next port (5001, 5002, etc.)
- Returns the first available port
- Logs a message if a different port is used

### Server Startup

The server will now:

1. Try to use port 5000 (or PORT environment variable)
2. If busy, automatically find the next available port
3. Start the server on the available port
4. Log which port is being used

## Usage

### Starting the Server

```bash
# Normal start (will auto-detect port if 5000 is busy)
npm start

# Safe start (kills any process on port 5000 first)
npm run start:safe

# Development mode with auto-restart
npm run dev
```

### Port Management Commands

```bash
# Find the next available port starting from 5000
npm run port:find

# Find available port starting from a specific port
node scripts/port-manager.js find 6000

# Kill all processes using port 5000
npm run port:kill

# Kill processes using a specific port
node scripts/port-manager.js kill 5000
```

### Manual Port Management

```bash
# Find available port
node scripts/port-manager.js find [port]

# Kill process on port
node scripts/port-manager.js kill [port]
```

## Environment Variables

- `PORT`: Set a specific port to use (default: 5000)
- `NODE_ENV`: Set to 'production' for production mode

## Examples

### Scenario 1: Port 5000 is busy

```bash
$ npm start
Server running on port 5001
Note: Port 5000 was busy, using port 5001 instead
```

### Scenario 2: Multiple ports are busy

```bash
$ npm start
Server running on port 5003
Note: Port 5000 was busy, using port 5003 instead
```

### Scenario 3: Kill process and start fresh

```bash
$ npm run start:safe
Killed process 12345 using port 5000
Server running on port 5000
```

## Troubleshooting

### If you still get EADDRINUSE errors:

1. **Check what's using the port:**

   ```bash
   # Windows
   netstat -ano | findstr :5000

   # macOS/Linux
   lsof -i :5000
   ```

2. **Kill the process manually:**

   ```bash
   # Windows
   taskkill /PID <process_id> /F

   # macOS/Linux
   kill -9 <process_id>
   ```

3. **Use the port manager:**
   ```bash
   npm run port:kill
   npm start
   ```

### If the frontend can't connect:

The frontend is configured to connect to `http://localhost:5000`. If the server starts on a different port, you'll need to:

1. **Update the frontend configuration** in `client/src/common/summaryApi.js`:

   ```javascript
   const rawBaseURL =
     import.meta.env.VITE_BACKEND_URL || "http://localhost:5001"; // Change port here
   ```

2. **Or set an environment variable:**
   ```bash
   # In client directory
   VITE_BACKEND_URL=http://localhost:5001 npm run dev
   ```

## Benefits

- ✅ No more `EADDRINUSE` crashes
- ✅ Automatic port detection
- ✅ Easy process management
- ✅ Safe startup options
- ✅ Cross-platform support (Windows, macOS, Linux)
- ✅ Development-friendly with clear logging

## Files Modified

- `server/index.js`: Added port detection logic
- `server/scripts/port-manager.js`: New port management utility
- `server/package.json`: Added new npm scripts
- `server/PORT_MANAGEMENT.md`: This documentation
