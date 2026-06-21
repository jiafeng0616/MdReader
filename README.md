# MdReader - Professional Markdown Reader & Converter


**MdReader** is a lightweight Markdown reader and editor built for Windows users. It features a sleek, modern UI and solves the biggest pain point for Markdown users — **perfectly formatting content for pasting into Microsoft Word**.

Built with the **Wails** (Go + WebView2) framework, it's lightweight yet powerful.

---

## ✨ Core Features

### 1. 📄 "Copy to Word" Mode
No more struggling with Markdown-to-Word formatting issues.
- **One-click copy**: Click the toolbar button to automatically render Markdown into rich text with inline styles.
- **Publication-ready formatting**: Built-in, carefully tuned CSS styles (serif fonts, proper line heights and paragraph spacing) — paste into Word and it's ready to use as a document or paper draft.

### 2. ⚡ High-Performance Progressive Rendering
- **Opens long documents in seconds**: Deeply optimized for documents with tens of thousands of words.
- **Smooth loading**: Uses chunked async rendering technology — open large files with instant response, remaining content loads silently in the background, no UI freeze.
- **Anti-white-screen mechanism**: Built-in global error boundary capture and retry mechanism, gracefully handles various problematic code blocks.

### 3. 🖥️ Deep Windows Native Integration
- **Right-click menu**: Supports adding to the Windows context menu, right-click any `.md` file to open it instantly.
- **Multi-tab**: Supports opening multiple documents simultaneously, with independent state management across tabs.
- **State persistence**: Editor scroll position and cursor position are perfectly preserved when switching tabs (using Z-Index stacking technique).
- **Session restore**: Automatically restores all open documents when you restart the app.

### 4. 📝 Read & Edit in One
- **Immersive reading**: Standard rendering based on GitHub Flavored Markdown with syntax highlighting.
- **Efficient editing**: Integrated CodeMirror editor with real-time editing and saving support.
- **Batch open**: Select and open multiple Markdown files at once via the file dialog.

### 5. 📊 Diagrams Support
- **Mermaid**: Flowcharts, sequence diagrams, Gantt charts, and more — rendered beautifully in the preview.
- **Draw.io**: Embedded Draw.io XML diagrams are rendered directly.
- **Excalidraw**: Hand-drawn style diagrams from Excalidraw JSON are supported.

### 6. 🔗 Navigation & Links
- **Table of Contents**: Sidebar navigation shows document headings, click to jump to any section.
- **Internal anchor links**: Click `[link](#heading)` to smoothly scroll to the target heading.
- **External links**: Click to open in your default browser.

### 7. 🎨 Theme & Display Options
- **Multiple themes**: Choose from Dark Blue (default), Dark (VS Code style), Light, Solarized Light, Solarized Dark, or Monokai themes.
- **Full-width mode**: Toggle between A4 fixed width and full window width for reading.
- **Fullscreen mode**: Enter fullscreen for distraction-free reading (press ESC to exit or click the floating exit button).
- **Save As**: Save current document as a new file with default name suggestion (original name + "_update").
- **Export HTML**: Export current document as an HTML file with styles, dark/light theme toggle support (prompts if file exists).
- **Session restore**: Automatically restores all open documents when you restart the app (only saves file paths to minimize config size).

---

## 🛠️ Tech Stack

*   **Backend**: Go (Wails v2 framework) — handles system interaction, file I/O, and registry operations.
*   **Frontend**: React + TypeScript + Vite — handles UI interactions.
*   **Styling**: TailwindCSS — modern responsive layout.
*   **Editor**: @uiw/react-codemirror.
*   **Rendering**: react-markdown + rehype-highlight + mermaid (diagrams support).

---

## 🚀 Getting Started (Development)

If you want to build this project locally:

### Prerequisites
- Go 1.18+
- Node.js 16+
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### Build Steps

1. Clone the repository
   ```bash
   git clone https://github.com/wangbao0754/MdReader.git
   cd MdReader
   ```

2. Install dependencies
   ```bash
   # Frontend dependencies are installed automatically, but you can also run manually
   cd frontend && npm install
   ```

3. Run in development mode
   ```bash
   wails dev
   ```

4. Build for production (Windows)
   ```bash
   wails build -clean
   ```
   After the build completes, the executable will be located at `build/bin/MdReader.exe`.

---

## 🤝 Contributing

Feel free to submit Issues or Pull Requests to improve this project! Whether it's fixing bugs or adding new features, your contributions are greatly appreciated.

## 📄 License

This project is licensed under the MIT License.
