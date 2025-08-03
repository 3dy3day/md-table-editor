import * as vscode from 'vscode';
import { TableInfo } from './markdownTableParser';
import { MarkdownTableParser } from './markdownTableParser';

export class TableEditorProvider {
    private panel: vscode.WebviewPanel | undefined;
    private currentEditor: vscode.TextEditor | undefined;
    private currentTableInfo: TableInfo | undefined;
    
    constructor(
        private readonly extensionUri: vscode.Uri
    ) {}
    
    public async createNewTable(editor: vscode.TextEditor) {
        // Create a default 2x2 table
        const defaultTable = [
            ['Header 1', 'Header 2'],
            ['Cell 1', 'Cell 2']
        ];
        
        // Generate markdown for the table
        const markdownTable = MarkdownTableParser.dataToMarkdown(defaultTable);
        
        // Get current cursor position
        const position = editor.selection.active;
        const line = position.line;
        
        // Insert the table at the current position
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(line, 0), markdownTable + '\n\n');
        });
        
        // Create TableInfo for the new table
        const startLine = line;
        const endLine = line + 2; // 2 rows + separator line
        const tableInfo: TableInfo = {
            data: defaultTable,
            range: new vscode.Range(startLine, 0, endLine, editor.document.lineAt(endLine).text.length),
            startLine: startLine,
            endLine: endLine,
            content: markdownTable
        };
        
        // Show the table editor
        this.showTableEditor(editor, tableInfo);
    }
    
    public showTableEditor(editor: vscode.TextEditor, tableInfo: TableInfo) {
        this.currentEditor = editor;
        this.currentTableInfo = tableInfo;
        
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;
        
        if (this.panel) {
            this.panel.reveal(columnToShowIn);
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'markdownTableEditor',
                'Markdown Table Editor',
                columnToShowIn,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            this.panel.webview.html = this.getWebviewContent(tableInfo);
            
            // Handle messages from the webview
            this.panel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'updateTable':
                            if (this.currentEditor && this.currentTableInfo) {
                                await this.updateTable(this.currentEditor, this.currentTableInfo, message.data);
                            }
                            break;
                        case 'addRow':
                            if (this.currentEditor && this.currentTableInfo) {
                                await this.addRow(this.currentEditor, this.currentTableInfo, message.position);
                            }
                            break;
                        case 'deleteRow':
                            if (this.currentEditor && this.currentTableInfo) {
                                await this.deleteRow(this.currentEditor, this.currentTableInfo, message.index);
                            }
                            break;
                        case 'addColumn':
                            if (this.currentEditor && this.currentTableInfo) {
                                await this.addColumn(this.currentEditor, this.currentTableInfo, message.position);
                            }
                            break;
                        case 'deleteColumn':
                            if (this.currentEditor && this.currentTableInfo) {
                                await this.deleteColumn(this.currentEditor, this.currentTableInfo, message.index);
                            }
                            break;
                    }
                },
                undefined,
                []
            );
            
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }
    }
    
    private async updateTable(editor: vscode.TextEditor, tableInfo: TableInfo, newData: string[][]) {
        const newMarkdown = MarkdownTableParser.dataToMarkdown(newData);
        await editor.edit(editBuilder => {
            editBuilder.replace(tableInfo.range, newMarkdown);
        });
        
        // Update the webview with success message
        if (this.panel) {
            this.panel.webview.postMessage({ command: 'updateSuccess' });
        }
    }
    
    private async addRow(editor: vscode.TextEditor, tableInfo: TableInfo, position: number) {
        // Don't update the document, just send message to webview
        if (this.panel) {
            this.panel.webview.postMessage({ 
                command: 'addRowToTable', 
                position: position 
            });
        }
    }
    
    private async deleteRow(editor: vscode.TextEditor, tableInfo: TableInfo, index: number) {
        // Don't update the document, just send message to webview
        if (this.panel) {
            this.panel.webview.postMessage({ 
                command: 'deleteRowFromTable', 
                index: index 
            });
        }
    }
    
    private async addColumn(editor: vscode.TextEditor, tableInfo: TableInfo, position: number) {
        // Don't update the document, just send message to webview
        if (this.panel) {
            this.panel.webview.postMessage({ 
                command: 'addColumnToTable', 
                position: position 
            });
        }
    }
    
    private async deleteColumn(editor: vscode.TextEditor, tableInfo: TableInfo, index: number) {
        // Don't update the document, just send message to webview
        if (this.panel) {
            this.panel.webview.postMessage({ 
                command: 'deleteColumnFromTable', 
                index: index 
            });
        }
    }
    
    private getWebviewContent(tableInfo: TableInfo): string {
        const tableData = JSON.stringify(tableInfo.data);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Table Editor</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 12px;
            margin: 0;
        }
        
        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            margin-bottom: 16px;
        }
        
        .toolbar-left {
            display: flex;
            gap: 8px;
        }
        
        .toolbar-right {
            display: flex;
            gap: 4px;
            align-items: center;
        }
        
        .divider {
            width: 1px;
            height: 20px;
            background-color: #3e3e42;
            margin: 0 4px;
        }
        
        button {
            border: none;
            cursor: pointer;
            font-size: 12px;
            font-weight: 400;
            transition: all 0.1s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            height: 28px;
            padding: 4px 12px;
            border-radius: 4px;
        }
        
        button:active {
            transform: translateY(1px);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Primary button style */
        button.primary {
            background-color: #0969da;
            color: #FFFFFF;
        }
        
        button.primary:hover:not(:disabled) {
            background-color: #0860ca;
        }
        
        /* Ghost button style */
        button.ghost {
            background-color: transparent;
            color: #CCCCCC;
            border: 1px solid #3a3d41;
        }
        
        button.ghost:hover:not(:disabled) {
            background-color: #3a3d41;
            border-color: #45494e;
        }
        
        /* Ghost icon button with text */
        button.ghost-icon {
            background-color: transparent;
            color: #CCCCCC;
            border: 1px solid #3a3d41;
            padding: 4px 10px;
            height: 28px;
        }
        
        button.ghost-icon:hover:not(:disabled) {
            background-color: #3a3d41;
            border-color: #45494e;
        }
        
        /* Icon-only button style */
        button.icon-only {
            background-color: transparent;
            color: #CCCCCC;
            width: 24px;
            height: 24px;
            padding: 0;
            border-radius: 3px;
            position: relative;
        }
        
        button.icon-only:hover:not(:disabled) {
            background-color: #2a2d2e;
        }
        
        /* Compact icon button */
        button.compact {
            background-color: transparent;
            color: #CCCCCC;
            padding: 4px 8px;
            height: 28px;
        }
        
        button.compact:hover:not(:disabled) {
            background-color: #2a2d2e;
        }
        
        .icon {
            font-size: 14px;
            line-height: 1;
        }
        
        /* Tooltip */
        .tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 4px;
            padding: 4px 8px;
            background-color: #1e1e1e;
            color: #CCCCCC;
            font-size: 12px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            border: 1px solid #454545;
            z-index: 1000;
        }
        
        button:hover .tooltip {
            opacity: 1;
        }
        
        .table-container {
            overflow: auto;
            padding: 0 16px;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            min-width: 100%;
        }
        
        th, td {
            border: 1px solid #3a3a3a;
            padding: 8px 12px;
            text-align: left;
            position: relative;
            overflow: visible;
        }
        
        th {
            background-color: #2b5797;
            color: #FFFFFF;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 10;
            padding: 10px 16px;
            text-align: left;
        }
        
        td {
            background-color: transparent;
            padding: 10px 16px;
        }
        
        /* Alternating row colors */
        tr:nth-child(even) td {
            background-color: rgba(255, 255, 255, 0.02);
        }
        
        /* Row hover */
        tr:hover td {
            background-color: rgba(255, 255, 255, 0.04);
        }
        
        td:focus-within,
        th:focus-within {
            outline: 2px solid #007ACC;
            outline-offset: -2px;
        }
        
        .cell-input {
            border: none;
            background: transparent;
            width: 100%;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            padding: 4px;
            outline: none !important;
        }
        
        .cell-input:focus {
            outline: none !important;
        }
        
        .context-menu {
            position: fixed;
            background: var(--vscode-menu-background);
            border: 1px solid var(--vscode-menu-border);
            border-radius: 3px;
            padding: 4px 0;
            display: none;
            z-index: 1000;
            box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .context-menu-item {
            padding: 6px 20px;
            cursor: pointer;
            font-size: 13px;
            color: var(--vscode-menu-foreground);
        }
        
        .context-menu-item:hover {
            background: var(--vscode-menu-selectionBackground);
            color: var(--vscode-menu-selectionForeground);
        }
        
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 3px;
            display: none;
        }
        
        .status.success {
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            color: var(--vscode-inputValidation-infoForeground);
            display: block;
        }
        
        .status.error {
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
            display: block;
        }
        
        .status-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 16px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .status-info {
            display: flex;
            gap: 12px;
        }
        
        .shortcuts {
            color: rgba(255, 255, 255, 0.4);
        }
        
        .vertical-divider {
            width: 1px;
            height: 20px;
            background-color: #3e3e42;
            margin: 0 8px;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="toolbar-left">
            <button class="primary" onclick="saveTable()">
                <span class="icon">💾</span>
                Save
            </button>
            <button class="ghost" onclick="resetTable()">Cancel</button>
        </div>
        
        <div class="toolbar-right">
            <button class="icon-only" onclick="undo()" id="undoButton">
                <span class="icon">↶</span>
                <span class="tooltip">Undo (Ctrl+Z)</span>
            </button>
            <button class="icon-only" onclick="redo()" id="redoButton">
                <span class="icon">↷</span>
                <span class="tooltip">Redo (Ctrl+Y)</span>
            </button>
            
            <div class="vertical-divider"></div>
            
            <button class="ghost-icon" onclick="addRow(-1)">
                <span class="icon">+</span>
                Add Row
            </button>
            <button class="ghost-icon" onclick="addColumn(-1)">
                <span class="icon">+</span>
                Add Column
            </button>
        </div>
    </div>
    
    <div class="table-container">
        <table id="markdownTable"></table>
    </div>
    
    <div id="status" class="status"></div>
    
    <div class="status-bar">
        <div class="status-info">
            <span id="tableSize">2×2 table</span>
        </div>
        <div class="shortcuts">
            Tab: navigate • Enter: edit • Ctrl+S: save
        </div>
    </div>
    
    <div id="contextMenu" class="context-menu">
        <div class="context-menu-item" onclick="deleteRowContext()">Delete Row</div>
        <div class="context-menu-item" onclick="deleteColumnContext()">Delete Column</div>
        <div class="context-menu-item" onclick="addRowAboveContext()">Add Row Above</div>
        <div class="context-menu-item" onclick="addRowBelowContext()">Add Row Below</div>
        <div class="context-menu-item" onclick="addColumnLeftContext()">Add Column Left</div>
        <div class="context-menu-item" onclick="addColumnRightContext()">Add Column Right</div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let tableData = ${tableData};
        let originalData = JSON.parse(JSON.stringify(tableData));
        let undoStack = [];
        let redoStack = [];
        let contextRow = -1;
        let contextCol = -1;
        
        function updateUndoRedoButtons() {
            const undoButton = document.getElementById('undoButton');
            const redoButton = document.getElementById('redoButton');
            
            if (undoButton) {
                undoButton.disabled = undoStack.length === 0;
            }
            if (redoButton) {
                redoButton.disabled = redoStack.length === 0;
            }
        }
        
        function updateTableSize() {
            const rows = tableData.length;
            const cols = tableData[0]?.length || 0;
            const tableSizeElement = document.getElementById('tableSize');
            if (tableSizeElement) {
                tableSizeElement.textContent = \`\${rows}×\${cols} table\`;
            }
        }
        
        function renderTable() {
            const table = document.getElementById('markdownTable');
            table.innerHTML = '';
            
            tableData.forEach((row, rowIndex) => {
                const tr = document.createElement('tr');
                
                row.forEach((cell, colIndex) => {
                    const isHeader = rowIndex === 0;
                    const cellElement = document.createElement(isHeader ? 'th' : 'td');
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'cell-input';
                    input.value = cell;
                    input.dataset.row = rowIndex;
                    input.dataset.col = colIndex;
                    
                    input.addEventListener('input', (e) => {
                        saveToUndoStack();
                        tableData[rowIndex][colIndex] = e.target.value;
                        redoStack = [];
                        updateUndoRedoButtons();
                    });
                    
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            navigateCell(rowIndex, colIndex, !e.shiftKey);
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            const nextRow = rowIndex + 1;
                            if (nextRow < tableData.length) {
                                const nextInput = document.querySelector(\`input[data-row="\${nextRow}"][data-col="\${colIndex}"]\`);
                                if (nextInput) {
                                    nextInput.focus();
                                    nextInput.select();
                                }
                            }
                        } else if (e.ctrlKey && e.key === 's') {
                            e.preventDefault();
                            saveTable();
                        } else if (e.ctrlKey && e.key === 'z') {
                            e.preventDefault();
                            undo();
                        } else if (e.ctrlKey && e.key === 'y') {
                            e.preventDefault();
                            redo();
                        }
                    });
                    
                    cellElement.appendChild(input);
                    
                    // Add right-click context menu
                    cellElement.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        showContextMenu(e, rowIndex, colIndex);
                    });
                    
                    tr.appendChild(cellElement);
                });
                
                table.appendChild(tr);
            });
            
            updateTableSize();
        }
        
        function navigateCell(row, col, forward) {
            const totalCells = tableData.length * tableData[0].length;
            const currentIndex = row * tableData[0].length + col;
            let nextIndex = forward ? currentIndex + 1 : currentIndex - 1;
            
            if (nextIndex < 0) nextIndex = totalCells - 1;
            if (nextIndex >= totalCells) nextIndex = 0;
            
            const nextRow = Math.floor(nextIndex / tableData[0].length);
            const nextCol = nextIndex % tableData[0].length;
            
            const nextInput = document.querySelector(\`input[data-row="\${nextRow}"][data-col="\${nextCol}"]\`);
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }
        
        function saveToUndoStack() {
            undoStack.push(JSON.parse(JSON.stringify(tableData)));
            if (undoStack.length > 50) undoStack.shift();
        }
        
        function undo() {
            if (undoStack.length > 0) {
                redoStack.push(JSON.parse(JSON.stringify(tableData)));
                tableData = undoStack.pop();
                renderTable();
                updateUndoRedoButtons();
                showStatus('Undo successful', 'success');
            }
        }
        
        function redo() {
            if (redoStack.length > 0) {
                undoStack.push(JSON.parse(JSON.stringify(tableData)));
                tableData = redoStack.pop();
                renderTable();
                updateUndoRedoButtons();
                showStatus('Redo successful', 'success');
            }
        }
        
        function saveTable() {
            vscode.postMessage({
                command: 'updateTable',
                data: tableData
            });
        }
        
        function showContextMenu(e, row, col) {
            const menu = document.getElementById('contextMenu');
            menu.style.display = 'block';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
            contextRow = row;
            contextCol = col;
        }
        
        function hideContextMenu() {
            document.getElementById('contextMenu').style.display = 'none';
        }
        
        function deleteRowContext() {
            hideContextMenu();
            deleteRow(contextRow);
        }
        
        function deleteColumnContext() {
            hideContextMenu();
            deleteColumn(contextCol);
        }
        
        function addRowAboveContext() {
            hideContextMenu();
            addRow(contextRow - 1);
        }
        
        function addRowBelowContext() {
            hideContextMenu();
            addRow(contextRow);
        }
        
        function addColumnLeftContext() {
            hideContextMenu();
            addColumn(contextCol - 1);
        }
        
        function addColumnRightContext() {
            hideContextMenu();
            addColumn(contextCol);
        }
        
        function addRow(position) {
            saveToUndoStack();
            vscode.postMessage({
                command: 'addRow',
                position: position
            });
        }
        
        function deleteRow(index) {
            saveToUndoStack();
            if (tableData.length <= 2) {
                showStatus('Cannot delete the last row', 'error');
                return;
            }
            vscode.postMessage({
                command: 'deleteRow',
                index: index
            });
        }
        
        function addColumn(position) {
            saveToUndoStack();
            vscode.postMessage({
                command: 'addColumn',
                position: position
            });
        }
        
        function deleteColumn(index) {
            saveToUndoStack();
            if (tableData[0].length <= 1) {
                showStatus('Cannot delete the last column', 'error');
                return;
            }
            vscode.postMessage({
                command: 'deleteColumn',
                index: index
            });
        }
        
        function resetTable() {
            saveToUndoStack();
            tableData = JSON.parse(JSON.stringify(originalData));
            renderTable();
            showStatus('Table reset to original state', 'success');
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
            setTimeout(() => {
                status.className = 'status';
            }, 3000);
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateSuccess':
                    showStatus('Table saved successfully!', 'success');
                    originalData = JSON.parse(JSON.stringify(tableData));
                    break;
                case 'addRowToTable':
                    addRowLocal(message.position);
                    break;
                case 'deleteRowFromTable':
                    deleteRowLocal(message.index);
                    break;
                case 'addColumnToTable':
                    addColumnLocal(message.position);
                    break;
                case 'deleteColumnFromTable':
                    deleteColumnLocal(message.index);
                    break;
            }
        });
        
        // Local functions that update only the webview
        function addRowLocal(position) {
            const columnCount = tableData[0]?.length || 0;
            const newRow = Array(columnCount).fill('');
            
            if (position === -1 || position >= tableData.length) {
                tableData.push(newRow);
            } else {
                tableData.splice(position + 1, 0, newRow);
            }
            
            renderTable();
        }
        
        function deleteRowLocal(index) {
            if (tableData.length <= 2) {
                showStatus('Cannot delete the last row', 'error');
                return;
            }
            tableData.splice(index, 1);
            renderTable();
        }
        
        function addColumnLocal(position) {
            tableData.forEach(row => {
                if (position === -1 || position >= row.length) {
                    row.push('');
                } else {
                    row.splice(position + 1, 0, '');
                }
            });
            renderTable();
        }
        
        function deleteColumnLocal(index) {
            if (tableData[0].length <= 1) {
                showStatus('Cannot delete the last column', 'error');
                return;
            }
            tableData.forEach(row => {
                row.splice(index, 1);
            });
            renderTable();
        }
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveTable();
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        });
        
        // Hide context menu on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#contextMenu')) {
                hideContextMenu();
            }
        });
        
        // Initial render
        renderTable();
        updateUndoRedoButtons();
        
        // Focus first cell
        document.querySelector('input[data-row="0"][data-col="0"]')?.focus();
    </script>
</body>
</html>`;
    }
}
