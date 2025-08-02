# Markdown Table Editor

A Visual Studio Code extension that provides an Excel-like editor for markdown tables.

## Features

- **Excel-like Interface**: Edit markdown tables in a familiar spreadsheet-style interface
- **Context Menu Integration**: Right-click on any markdown table to open the editor
- **Real-time Updates**: Changes in the editor are reflected immediately in your markdown file
- **Keyboard Navigation**: Use Tab/Shift+Tab to navigate between cells, Enter to move down
- **Row/Column Management**: Add or delete rows and columns with ease
- **Visual Feedback**: Hover actions and visual indicators for better user experience

## Usage

1. Open a markdown file (`.md`) in VS Code
2. Place your cursor inside a markdown table
3. Right-click and select "Edit Markdown Table" from the context menu
4. The table editor will open in a side panel
5. Edit cells directly by clicking on them
6. Use the toolbar buttons or hover actions to add/remove rows and columns
7. Click "Save Changes" to update the markdown file

## Keyboard Shortcuts

- `Tab`: Move to next cell
- `Shift+Tab`: Move to previous cell
- `Enter`: Move to cell below

## Requirements

- VS Code version 1.74.0 or higher

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile TypeScript
4. Press `F5` to run the extension in a new VS Code window

## Development

- `npm run compile`: Compile TypeScript files
- `npm run watch`: Watch for changes and recompile
- `npm run lint`: Run ESLint

## License

ISC
