// Simple Markdown to HTML converter
// This is a basic converter for export purposes - for display, use MarkdownPreview component

export function markdownToHtml(markdown: string): string {
    let html = markdown;

    // Escape HTML entities first (but preserve our markdown syntax)
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // Code blocks (```...```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Inline code (`...`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists
    html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Paragraphs (lines that don't start with HTML tags)
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    // Add line breaks for single newlines (within paragraphs)
    html = html.replace(/([^>\n])\n([^<\n])/g, '$1<br>$2');

    return html;
}

export function generateHtmlDocument(title: string, content: string, markdownContent: string): string {
    const bodyHtml = markdownToHtml(content);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        /* Theme Toggle Button */
        .theme-toggle {
            position: fixed;
            top: 16px;
            right: 16px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .theme-toggle:hover {
            transform: scale(1.1);
        }

        /* Light Theme */
        body.light {
            color: #333;
            background: #fff;
        }
        body.light h1, body.light h2, body.light h3, body.light h4, body.light h5, body.light h6 {
            color: #1a1a1a;
        }
        body.light h1 { border-bottom: 2px solid #eee; }
        body.light h2 { border-bottom: 1px solid #eee; }
        body.light code {
            background: #f4f4f4;
            color: #e83e8c;
        }
        body.light pre {
            background: #f4f4f4;
        }
        body.light pre code {
            background: none;
        }
        body.light blockquote {
            border-left: 4px solid #ddd;
            color: #666;
            background: #f9f9f9;
        }
        body.light th {
            background: #f4f4f4;
        }
        body.light th, body.light td {
            border: 1px solid #ddd;
        }
        body.light hr {
            border-top: 1px solid #ddd;
        }
        body.light a {
            color: #0066cc;
        }
        body.light .theme-toggle {
            background: #333;
            color: #fff;
        }
        body.light .theme-toggle:hover {
            background: #555;
        }

        /* Dark Theme (Default) */
        body.dark {
            color: #e0e0e0;
            background: #1e1e1e;
        }
        body.dark h1, body.dark h2, body.dark h3, body.dark h4, body.dark h5, body.dark h6 {
            color: #ffffff;
        }
        body.dark h1 { border-bottom: 2px solid #3c3c3c; }
        body.dark h2 { border-bottom: 1px solid #3c3c3c; }
        body.dark code {
            background: #2d2d2d;
            color: #ce9178;
        }
        body.dark pre {
            background: #2d2d2d;
        }
        body.dark pre code {
            background: none;
        }
        body.dark blockquote {
            border-left: 4px solid #4a4a4a;
            color: #a0a0a0;
            background: #252525;
        }
        body.dark th {
            background: #2d2d2d;
        }
        body.dark th, body.dark td {
            border: 1px solid #3c3c3c;
        }
        body.dark hr {
            border-top: 1px solid #3c3c3c;
        }
        body.dark a {
            color: #6db3f2;
        }
        body.dark .theme-toggle {
            background: #fff;
            color: #333;
        }
        body.dark .theme-toggle:hover {
            background: #ddd;
        }

        /* Base Styles */
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            transition: background 0.3s ease, color 0.3s ease;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }
        h1 { font-size: 2em; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }
        h4, h5, h6 { font-size: 1em; }
        p { margin: 1em 0; }
        code {
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: "Consolas", "Monaco", monospace;
            font-size: 0.9em;
        }
        pre {
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
        }
        pre code {
            padding: 0;
        }
        blockquote {
            margin: 1em 0;
            padding-left: 1em;
            padding-right: 1em;
        }
        ul, ol {
            padding-left: 2em;
        }
        li {
            margin: 0.3em 0;
        }
        a {
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        th, td {
            padding: 0.5em;
            text-align: left;
        }
    </style>
</head>
<body class="dark">
    <button class="theme-toggle" onclick="toggleTheme()" title="切换主题">
        <span id="theme-icon">☀️</span>
    </button>
    <article>
        ${bodyHtml}
    </article>
    <script>
        function toggleTheme() {
            const body = document.body;
            const icon = document.getElementById('theme-icon');
            if (body.classList.contains('dark')) {
                body.classList.remove('dark');
                body.classList.add('light');
                icon.textContent = '🌙';
            } else {
                body.classList.remove('light');
                body.classList.add('dark');
                icon.textContent = '☀️';
            }
        }
    </script>
    <!-- Source Markdown:
${markdownContent}
    -->
</body>
</html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
