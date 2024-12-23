import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { homedir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

const getConfigPath = () => {
  const homeDir = homedir();
  // Using path.join for cross-platform path handling
  return join(homeDir, '.openhue');
};

// Docker command builder
const buildDockerCommand = (command: string) => {
  const configPath = getConfigPath();
  return `docker run -v "${configPath}:/.openhue" --rm openhue/cli ${command}`;
};

// Validation schemas
const LightActionSchema = z.object({
  target: z.string(),
  action: z.enum(["on", "off"]),
  brightness: z.number().min(0).max(100).optional(),
  color: z.string().optional(),
  temperature: z.number().min(153).max(500).optional(),
});

const RoomActionSchema = z.object({
  target: z.string(),
  action: z.enum(["on", "off"]),
  brightness: z.number().min(0).max(100).optional(),
  color: z.string().optional(),
  temperature: z.number().min(153).max(500).optional(),
});

const SceneActionSchema = z.object({
  name: z.string(),
  room: z.string().optional(),
  mode: z.enum(["active", "dynamic", "static"]).optional(),
});

// Create server instance
const server = new Server(
  {
    name: "hue-control",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to execute OpenHue commands
async function executeHueCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(buildDockerCommand(command));
    if (stderr) {
      console.error("Command error:", stderr);
      throw new Error(stderr);
    }
    return stdout;
  } catch (error) {
    console.error("Execution error:", error);
    throw error;
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get-lights",
        description: "List all Hue lights or get details for a specific light",
        inputSchema: {
          type: "object",
          properties: {
            lightId: {
              type: "string",
              description: "Optional light ID or name to get specific light details",
            },
            room: {
              type: "string",
              description: "Optional room name to filter lights",
            },
          },
        },
      },
      {
        name: "control-light",
        description: "Control a specific Hue light",
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              description: "Light ID or name",
            },
            action: {
              type: "string",
              enum: ["on", "off"],
              description: "Turn light on or off",
            },
            brightness: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Optional brightness level (0-100)",
            },
            color: {
              type: "string",
              description: "Optional color name (e.g., 'red', 'blue')",
            },
            temperature: {
              type: "number",
              minimum: 153,
              maximum: 500,
              description: "Optional color temperature in Mirek",
            },
          },
          required: ["target", "action"],
        },
      },
      {
        name: "get-rooms",
        description: "List all rooms or get details for a specific room",
        inputSchema: {
          type: "object",
          properties: {
            roomId: {
              type: "string",
              description: "Optional room ID or name to get specific room details",
            },
          },
        },
      },
      {
        name: "control-room",
        description: "Control all lights in a room",
        inputSchema: {
          type: "object",
          properties: {
            target: {
              type: "string",
              description: "Room ID or name",
            },
            action: {
              type: "string",
              enum: ["on", "off"],
              description: "Turn room lights on or off",
            },
            brightness: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Optional brightness level (0-100)",
            },
            color: {
              type: "string",
              description: "Optional color name",
            },
            temperature: {
              type: "number",
              minimum: 153,
              maximum: 500,
              description: "Optional color temperature in Mirek",
            },
          },
          required: ["target", "action"],
        },
      },
      {
        name: "get-scenes",
        description: "List all scenes or get details for specific scenes",
        inputSchema: {
          type: "object",
          properties: {
            room: {
              type: "string",
              description: "Optional room name to filter scenes",
            },
          },
        },
      },
      {
        name: "activate-scene",
        description: "Activate a specific scene",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Scene name or ID",
            },
            room: {
              type: "string",
              description: "Optional room name for the scene",
            },
            mode: {
              type: "string",
              enum: ["active", "dynamic", "static"],
              description: "Optional scene mode",
            },
          },
          required: ["name"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get-lights": {
        let command = "get light";
        if (args?.lightId) {
          command += ` "${args.lightId}"`;
        }
        if (args?.room) {
          command += ` --room "${args.room}"`;
        }
        command += " --json";
        const result = await executeHueCommand(command);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      case "control-light": {
        const params = LightActionSchema.parse(args);
        let command = `set light "${params.target}" --${params.action}`;
        if (params.brightness !== undefined) {
          command += ` --brightness ${params.brightness}`;
        }
        if (params.color) {
          command += ` --color ${params.color}`;
        }
        if (params.temperature) {
          command += ` --temperature ${params.temperature}`;
        }
        await executeHueCommand(command);
        return {
          content: [
            {
              type: "text",
              text: `Successfully set light "${params.target}" to ${params.action}`,
            },
          ],
        };
      }

      case "get-rooms": {
        let command = "get room";
        if (args?.roomId) {
          command += ` "${args.roomId}"`;
        }
        command += " --json";
        const result = await executeHueCommand(command);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      case "control-room": {
        const params = RoomActionSchema.parse(args);
        let command = `set room "${params.target}" --${params.action}`;
        if (params.brightness !== undefined) {
          command += ` --brightness ${params.brightness}`;
        }
        if (params.color) {
          command += ` --color ${params.color}`;
        }
        if (params.temperature) {
          command += ` --temperature ${params.temperature}`;
        }
        await executeHueCommand(command);
        return {
          content: [
            {
              type: "text",
              text: `Successfully set room "${params.target}" to ${params.action}`,
            },
          ],
        };
      }

      case "get-scenes": {
        let command = "get scene";
        if (args?.room) {
          command += ` --room "${args.room}"`;
        }
        command += " --json";
        const result = await executeHueCommand(command);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      case "activate-scene": {
        const params = SceneActionSchema.parse(args);
        let command = `set scene "${params.name}"`;
        if (params.room) {
          command += ` --room "${params.room}"`;
        }
        if (params.mode) {
          command += ` --action ${params.mode}`;
        }
        await executeHueCommand(command);
        return {
          content: [
            {
              type: "text",
              text: `Successfully activated scene "${params.name}"`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hue Control MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});