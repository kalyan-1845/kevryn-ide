import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

export class KevrynMcpServer {
    private server: McpServer;
    private apiUrl: string;
    private token: string | null = null;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
        
        // Initialize the MCP Server
        this.server = new McpServer({
            name: "KevRyn Desktop MCP Server",
            version: "1.0.0"
        });

        this.registerTools();
        this.setupIpcAuth();
    }

    private setupIpcAuth() {
        if (process.env.KEVRYN_MCP_TOKEN) {
            this.token = process.env.KEVRYN_MCP_TOKEN;
            console.log("MCP Server: Authenticated via ENV");
        }

        try {
            // Only runs if executed within Electron
            const { ipcMain } = require('electron');
            if (ipcMain) {
                ipcMain.on('mcp-set-token', (event: any, token: string) => {
                    this.token = token;
                    console.log("MCP Server: Received Authorization Token via IPC");
                });
            }
        } catch (e) {
            // Running in standalone Node.js environment (e.g., via Cursor/VS Code)
        }
    }

    private registerTools() {
        // Tool: Get Student Profile
        this.server.tool("get_student_profile",
            "Fetches a comprehensive profile of a specific student for faculty analysis.",
            { studentId: z.string().describe("The UUID or Registration Number of the student") },
            async ({ studentId }) => {
                if (!this.token) return { content: [{ type: "text", text: "PERMISSION_DENIED: No active session." }] };
                try {
                    const res = await axios.get(`${this.apiUrl}/faculty/student/${studentId}`, {
                        headers: { Authorization: `Bearer ${this.token}` }
                    });
                    return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
                } catch (e: any) {
                    return { content: [{ type: "text", text: `Error fetching student profile: ${e.message}` }] };
                }
            }
        );

        // Tool: Get Class Performance
        this.server.tool("get_class_performance",
            "Fetches aggregate performance metrics and historical grades for a specific class or course.",
            { courseId: z.string().describe("The ID of the course") },
            async ({ courseId }) => {
                if (!this.token) return { content: [{ type: "text", text: "PERMISSION_DENIED: No active session." }] };
                try {
                    const res = await axios.get(`${this.apiUrl}/faculty/course/${courseId}/performance`, {
                        headers: { Authorization: `Bearer ${this.token}` }
                    });
                    return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
                } catch (e: any) {
                    return { content: [{ type: "text", text: `Error fetching class performance: ${e.message}` }] };
                }
            }
        );

        // Tool: Generate Session Plan
        this.server.tool("generate_session_plan",
            "Saves an AI-generated session plan directly to the KevRyn database as a draft for the faculty member.",
            { 
                courseId: z.string(), 
                topic: z.string(),
                planContent: z.string()
            },
            async ({ courseId, topic, planContent }) => {
                if (!this.token) return { content: [{ type: "text", text: "PERMISSION_DENIED: No active session." }] };
                try {
                    const res = await axios.post(`${this.apiUrl}/faculty/course/${courseId}/session-plans`, 
                        { topic, content: planContent, status: 'draft' },
                        { headers: { Authorization: `Bearer ${this.token}` } }
                    );
                    return { content: [{ type: "text", text: `Session plan created successfully with ID: ${res.data._id}` }] };
                } catch (e: any) {
                    return { content: [{ type: "text", text: `Error creating session plan: ${e.message}` }] };
                }
            }
        );
    }

    public async startStdio() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log("KevRyn MCP Server running on STDIO");
    }
}
