import * as vscode from 'vscode';

export interface TableInfo {
    startLine: number;
    endLine: number;
    content: string;
    data: string[][];
    range: vscode.Range;
}

export class MarkdownTableParser {
    /**
     * Find a markdown table at the given position in the document
     */
    static findTableAtPosition(document: vscode.TextDocument, position: vscode.Position): TableInfo | null {
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
        const lines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(document.lineAt(i).text);
        }
        
        const content = lines.join('\n');
        const data = this.parseTableData(lines);
        
        if (data.length === 0) {
            return null;
        }
        
        const range = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(endLine, document.lineAt(endLine).text.length)
        );
        
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
    private static isTableLine(line: string): boolean {
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
    private static parseTableData(lines: string[]): string[][] {
        const data: string[][] = [];
        
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
    private static parseCells(line: string): string[] {
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
    static dataToMarkdown(data: string[][]): string {
        if (data.length === 0) {
            return '';
        }
        
        const columnCount = Math.max(...data.map(row => row.length));
        const lines: string[] = [];
        
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
