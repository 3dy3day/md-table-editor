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
exports.TableEditorProvider = void 0;
const vscode = __importStar(require("vscode"));
const markdownTableParser_1 = require("./markdownTableParser");
class TableEditorProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    async createNewTable(editor) {
        // Create a default 2x2 table
        const defaultTable = [
            ['Header 1', 'Header 2'],
            ['Cell 1', 'Cell 2']
        ];
        // Generate markdown for the table
        const markdownTable = markdownTableParser_1.MarkdownTableParser.dataToMarkdown(defaultTable);
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
        const tableInfo = {
            data: defaultTable,
            range: new vscode.Range(startLine, 0, endLine, editor.document.lineAt(endLine).text.length),
            startLine: startLine,
            endLine: endLine,
            content: markdownTable
        };
        // Show the table editor
        this.showTableEditor(editor, tableInfo);
    }
    showTableEditor(editor, tableInfo) {
        this.currentEditor = editor;
        this.currentTableInfo = tableInfo;
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;
        if (this.panel) {
            this.panel.reveal(columnToShowIn);
        }
        else {
            this.panel = vscode.window.createWebviewPanel('markdownTableEditor', 'Markdown Table Editor', columnToShowIn, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.panel.webview.html = this.getWebviewContent(tableInfo);
            // Handle messages from the webview
            this.panel.webview.onDidReceiveMessage(async (message) => {
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
            }, undefined, []);
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }
    }
    async updateTable(editor, tableInfo, newData) {
        const newMarkdown = markdownTableParser_1.MarkdownTableParser.dataToMarkdown(newData);
        await editor.edit(editBuilder => {
            editBuilder.replace(tableInfo.range, newMarkdown);
        });
        // Update the webview with success message
        if (this.panel) {
            this.panel.webview.postMessage({ command: 'updateSuccess' });
        }
    }
    async addRow(editor, tableInfo, position) {
        // Don't update the document, just send message to webview
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'addRowToTable',
                position: position
            });
        }
    }
    async deleteRow(editor, tableInfo, index) {
        // Don't update the document, just send message to webview
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'deleteRowFromTable',
                index: index
            });
        }
    }
    async addColumn(editor, tableInfo, position) {
        // Don't update the document, just send message to webview
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'addColumnToTable',
                position: position
            });
        }
    }
    async deleteColumn(editor, tableInfo, index) {
        // Don't update the document, just send message to webview
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'deleteColumnFromTable',
                index: index
            });
        }
    }
    getWebviewContent(tableInfo) {
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
            padding: 20px;
            margin: 0;
        }
        
        .toolbar {
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 14px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 13px;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        button:active {
            transform: translateY(1px);
        }
        
        button.save {
            background-color: #53D769;
            color: white;
        }
        
        button.save:hover {
            background-color: #42c558;
        }
        
        button.discard {
            background-color: #FC3D39;
            color: white;
        }
        
        button.discard:hover {
            background-color: #e02622;
        }
        
        button:not(.save):not(.discard) {
            background-color: #F8F8F8;
            color: #000000;
        }
        
        button:not(.save):not(.discard):hover {
            background-color: #E8E8E8;
        }
        
        .toolbar-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .table-container {
            overflow: auto;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            background-color: var(--vscode-editor-background);
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            min-width: 100%;
        }
        
        th, td {
            border: 1px solid var(--vscode-widget-border);
            padding: 8px;
            text-align: left;
            position: relative;
            overflow: visible;
        }
        
        th {
            background-color: var(--vscode-editor-selectionBackground);
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        td {
            background-color: var(--vscode-editor-background);
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
        
        .help-text {
            margin-top: 20px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="toolbar-row">
            <button class="save" onclick="saveTable()">Save</button>
            <button class="discard" onclick="resetTable()">Discard</button>
        </div>
        <div class="toolbar-row">
            <button onclick="undo()">Undo</button>
            <button onclick="redo()">Redo</button>
            <button onclick="addRow(-1)">Add Row</button>
            <button onclick="addColumn(-1)">Add Column</button>
        </div>
    </div>
    
    <div class="table-container">
        <table id="markdownTable"></table>
    </div>
    
    <div id="status" class="status"></div>
    
    <div class="help-text">
        💡 Tips: Click any cell to edit. Use Tab/Shift+Tab to navigate. Right-click for adding/deleting rows and columns.
        <br>Shortcuts: Ctrl+S to save, Ctrl+Z to undo, Ctrl+Y to redo
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
                showStatus('Undo successful', 'success');
            }
        }
        
        function redo() {
            if (redoStack.length > 0) {
                undoStack.push(JSON.parse(JSON.stringify(tableData)));
                tableData = redoStack.pop();
                renderTable();
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
        
        // Focus first cell
        document.querySelector('input[data-row="0"][data-col="0"]')?.focus();
    </script>
</body>
</html>`;
    }
}
exports.TableEditorProvider = TableEditorProvider;
//# sourceMappingURL=tableEditorProvider.js.map