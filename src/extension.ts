import * as vscode from 'vscode';
import { TableEditorProvider } from './tableEditorProvider';
import { MarkdownTableParser } from './markdownTableParser';

export function activate(context: vscode.ExtensionContext) {
    console.log('Markdown Table Editor extension is now active!');

    // Create a single instance of the table editor provider
    const tableEditor = new TableEditorProvider(context.extensionUri);

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
        const tableInfo = MarkdownTableParser.findTableAtPosition(editor.document, position);
        
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

export function deactivate() {}
