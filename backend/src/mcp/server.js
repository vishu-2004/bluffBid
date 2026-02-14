// MCP Server
// Central registry that wires Tools, Resources, and Prompts together.
// Provides a factory to create server instances bound to specific game state.

import { placeBidTool } from './tools/placeBid.js';
import { matchStatusResource } from './resources/matchStatus.js';
import { bidAggressivelyPrompt } from './prompts/bidAggressively.js';

/**
 * Create an MCP server instance bound to a specific game state.
 * The server provides access to registered tools, resources, and prompts.
 *
 * @param {object} gameState - The current game state
 * @returns {object} MCP server instance with tool/resource/prompt access
 */
export function createServer(gameState) {
    // --- Tool Registry ---
    const tools = new Map();
    tools.set(placeBidTool.name, placeBidTool);

    // --- Resource Registry ---
    const resources = new Map();
    resources.set(matchStatusResource.uri, matchStatusResource);

    // --- Prompt Registry ---
    const prompts = new Map();
    prompts.set(bidAggressivelyPrompt.name, bidAggressivelyPrompt);

    return {
        // ---- Tools ----

        /** List all registered tools with their schemas */
        listTools() {
            return Array.from(tools.values()).map(t => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema
            }));
        },

        /**
         * Call a tool by name.
         * @param {string} name - Tool name
         * @param {object} args - Tool arguments
         * @returns {object} Tool result
         */
        callTool(name, args) {
            const tool = tools.get(name);
            if (!tool) {
                throw new Error(`Tool not found: ${name}`);
            }
            // Pass game state as context to the tool
            return tool.handler(args, gameState);
        },

        // ---- Resources ----

        /** List all registered resources */
        listResources() {
            return Array.from(resources.values()).map(r => ({
                uri: r.uri,
                name: r.name,
                mimeType: r.mimeType,
                description: r.description
            }));
        },

        /**
         * Read a resource by URI.
         * @param {string} uri - Resource URI
         * @returns {object} Resource data
         */
        readResource(uri) {
            const resource = resources.get(uri);
            if (!resource) {
                throw new Error(`Resource not found: ${uri}`);
            }
            return resource.read(gameState);
        },

        // ---- Prompts ----

        /** List all registered prompts */
        listPrompts() {
            return Array.from(prompts.values()).map(p => ({
                name: p.name,
                description: p.description
            }));
        },

        /**
         * Get a prompt's messages by name.
         * @param {string} name - Prompt name
         * @param {object} [args] - Optional arguments for the prompt
         * @returns {object[]} Array of messages
         */
        getPrompt(name, args = {}) {
            const prompt = prompts.get(name);
            if (!prompt) {
                throw new Error(`Prompt not found: ${name}`);
            }
            return prompt.getMessages(args);
        },

        /**
         * Execute a prompt's strategy.
         * @param {string} name - Prompt name
         * @param {object} status - Match status from resource
         * @returns {object} Strategy result
         */
        executePrompt(name, status) {
            const prompt = prompts.get(name);
            if (!prompt || !prompt.execute) {
                throw new Error(`Prompt not found or not executable: ${name}`);
            }
            return prompt.execute(status);
        }
    };
}
