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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const tableEditorProvider_1 = require("./tableEditorProvider");
const markdownTableParser_1 = require("./markdownTableParser");
function activate(context) {
    console.log('Markdown Table Editor extension is now active!');
    // Create a single instance of the table editor provider
    const tableEditor = new tableEditorProvider_1.TableEditorProvider(context.extensionUri);
    // Register the command to edit tables
    let editCommand = vscode.commands.registerCommand('mdTableEditor.editTable', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        if (editor.document.languageId !== 'markdown') {
            vscode.window.showErrorMessage('This command only works with Markdown files');
            return;
        }
        // Get the current cursor position
        const position = editor.selection.active;
        // Find the table at the cursor position
        const tableInfo = markdownTableParser_1.MarkdownTableParser.findTableAtPosition(editor.document, position);
        if (!tableInfo) {
            vscode.window.showErrorMessage('No table found at cursor position');
            return;
        }
        // Show the table editor
        tableEditor.showTableEditor(editor, tableInfo);
    });
    // Register the command to create new tables
    let createCommand = vscode.commands.registerCommand('mdTableEditor.createTable', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        if (editor.document.languageId !== 'markdown') {
            vscode.window.showErrorMessage('This command only works with Markdown files');
            return;
        }
        // Create a new table
        tableEditor.createNewTable(editor);
    });
    context.subscriptions.push(editCommand, createCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map