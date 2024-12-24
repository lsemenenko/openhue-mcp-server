# OpenHue MCP Server

An MCP server that enables control of Philips Hue lights through Claude and other LLM interfaces using the OpenHue CLI.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker](https://www.docker.com/get-started)
- [Claude for Desktop](https://claude.ai/download) (optional, for testing)

## Bridge Setup

Before using the server, you need to set up the OpenHue CLI with your Hue Bridge:

1. Run the setup command:
```bash
# On Linux/macOS:
docker run -v "${HOME}/.openhue:/.openhue" --rm --name=openhue -it openhue/cli setup

# On Windows (PowerShell):
docker run -v "${env:USERPROFILE}\.openhue:/.openhue" --rm --name=openhue -it openhue/cli setup
```

2. Follow the on-screen instructions:
   - The CLI will search for your Hue Bridge
   - Press the link button on your Hue Bridge when prompted
   - Wait for confirmation that the setup is complete

3. Verify the setup by listing your lights:
```bash
# On Linux/macOS:
docker run -v "${HOME}/.openhue:/.openhue" --rm --name=openhue -it openhue/cli get lights

# On Windows (PowerShell):
docker run -v "${env:USERPROFILE}\.openhue:/.openhue" --rm --name=openhue -it openhue/cli get lights
```

If you see your lights listed, the setup is complete and you're ready to use the MCP server.

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd claude-mcp-openhue
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run the server:
```bash
npm start
```

## Features

This server exposes the following capabilities through MCP:

### Lights Control
- List all lights or get specific light details
- Turn lights on/off
- Adjust brightness
- Set colors
- Control color temperature

### Room Control
- List all rooms or get room details
- Control all lights in a room together
- Set room-wide brightness and colors

### Scene Management
- List available scenes
- Activate scenes with different modes
- Filter scenes by room

## Usage with Claude Desktop

1. Open your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server configuration:
```json
{
  "mcpServers": {
    "hue": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"]
    }
  }
}
```

3. Restart Claude Desktop

4. Look for the hammer icon to verify the server is connected

## Example Commands

Once connected, you can ask Claude natural language questions like:

- "What lights do I have in the living room?"
- "Turn on all the lights in the kitchen"
- "Set the bedroom lights to 50% brightness"
- "Change the office lights to blue"
- "Activate the 'Relaxing' scene"
- "What scenes are available in the den?"

## Available Tools

### get-lights
Lists all lights or gets details for specific lights
```typescript
{
  lightId?: string;  // Optional light ID or name
  room?: string;     // Optional room name filter
}
```

### control-light
Controls individual lights
```typescript
{
  target: string;    // Light ID or name
  action: "on" | "off";
  brightness?: number; // 0-100
  color?: string;     // Color name
  temperature?: number; // 153-500 Mirek
}
```

### get-rooms
Lists all rooms or gets specific room details
```typescript
{
  roomId?: string;  // Optional room ID or name
}
```

### control-room
Controls all lights in a room
```typescript
{
  target: string;    // Room ID or name
  action: "on" | "off";
  brightness?: number;
  color?: string;
  temperature?: number;
}
```

### get-scenes
Lists available scenes
```typescript
{
  room?: string;    // Optional room name filter
}
```

### activate-scene
Activates a specific scene
```typescript
{
  name: string;     // Scene name or ID
  room?: string;    // Optional room name
  mode?: "active" | "dynamic" | "static";
}
```

## Development

### Project Structure
```
.
├── src/
│   └── index.ts    # Main server implementation
├── build/          # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Building
```bash
npm run build
```

### Running
```bash
npm start
```

## Troubleshooting

### Server Not Connecting
1. Check that Docker is running
2. Verify OpenHue configuration exists
3. Check Claude Desktop logs
4. Try running OpenHue CLI directly

### Command Failures
1. Check OpenHue CLI permissions
2. Verify light/room/scene names
3. Check Docker container logs
4. Verify Hue Bridge connectivity

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request