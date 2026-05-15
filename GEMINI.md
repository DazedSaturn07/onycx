# Project Intelligence: Portfolio

This project uses **graphify** to maintain a knowledge graph of the codebase.

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

### Rules for AI Agents:
- **Before answering architecture or codebase questions**, read `graphify-out/GRAPH_REPORT.md` for high-level structure and community analysis.
- **Context Mode**: If you need a condensed architectural summary to ground your reasoning, read `graphify-out/CONTEXT.md`.
- **Deep Dive**: If you need to understand specific component relationships, use the `/graphify query` command.
- **Wiki**: Detailed documentation for core modules is available in `graphify-out/wiki/index.md`.

### Commands:
- `/graphify update .`: Rebuild the knowledge graph after significant changes.
- `/graphify query "your question"`: Search the knowledge graph for specific logic or patterns.
- `/graphify explain <NodeName>`: Get a detailed breakdown of a specific file or function.
