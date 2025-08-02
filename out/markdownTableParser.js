"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownTableParser = void 0;
const vscode = __importStar(require("vscode"));
class MarkdownTableParser {
    /**
     * Find a markdown table at the given position in the document
     */
    static findTableAtPosition(document, position) {
        const line = position.line;
        // Find the start and end of the table
        let startLine = line;
        let endLine = line;
        // Check if current line is part of a table
        if (!this.isTableLine(document.lineAt(line).text)) {
            return null;
        }
        // Find start of table
        while (startLine > 0 && this.isTableLine(document.lineAt(startLine - 1).text)) {
            startLine--;
        }
        // Find end of table
        while (endLine < document.lineCount - 1 && this.isTableLine(document.lineAt(endLine + 1).text)) {
            endLine++;
        }
        // Extract table content
        const lines = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(document.lineAt(i).text);
        }
        const content = lines.join('\n');
        const data = this.parseTableData(lines);
        if (data.length === 0) {
            return null;
        }
        const range = new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(endLine, document.lineAt(endLine).text.length));
        return {
            startLine,
            endLine,
            content,
            data,
            range
        };
    }
    /**
     * Check if a line is part of a markdown table
     */
    static isTableLine(line) {
        // Check if line contains pipes and has content
        const trimmed = line.trim();
        if (!trimmed || !trimmed.includes('|')) {
            return false;
        }
        // Check if it's a separator line
        if (trimmed.match(/^\|?[\s\-:]+\|[\s\-:|]+$/)) {
            return true;
        }
        // Check if it's a content line
        if (trimmed.match(/^\|?.+\|.+$/)) {
            return true;
        }
        return false;
    }
    /**
     * Parse table lines into a 2D array of cell data
     */
    static parseTableData(lines) {
        const data = [];
        for (const line of lines) {
            // Skip separator lines
            if (line.match(/^\|?[\s\-:]+\|[\s\-:|]+$/)) {
                continue;
            }
            // Parse cells
            const cells = this.parseCells(line);
            if (cells.length > 0) {
                data.push(cells);
            }
        }
        return data;
    }
    /**
     * Parse cells from a table row
     */
    static parseCells(line) {
        // Remove leading and trailing pipes if present
        let trimmed = line.trim();
        if (trimmed.startsWith('|')) {
            trimmed = trimmed.substring(1);
        }
        if (trimmed.endsWith('|')) {
            trimmed = trimmed.substring(0, trimmed.length - 1);
        }
        // Split by pipes and trim each cell
        return trimmed.split('|').map(cell => cell.trim());
    }
    /**
     * Convert 2D array data back to markdown table format
     */
    static dataToMarkdown(data) {
        if (data.length === 0) {
            return '';
        }
        const columnCount = Math.max(...data.map(row => row.length));
        const lines = [];
        // Add header row
        if (data.length > 0) {
            const headerCells = data[0].map(cell => ` ${cell} `);
            lines.push('|' + headerCells.join('|') + '|');
            // Add separator
            const separator = Array(columnCount).fill(' --- ').join('|');
            lines.push('|' + separator + '|');
            // Add data rows
            for (let i = 1; i < data.length; i++) {
                const cells = data[i].map(cell => ` ${cell} `);
                // Pad with empty cells if needed
                while (cells.length < columnCount) {
                    cells.push('   ');
                }
                lines.push('|' + cells.join('|') + '|');
            }
        }
        return lines.join('\n');
    }
}
exports.MarkdownTableParser = MarkdownTableParser;
//# sourceMappingURL=markdownTableParser.js.map