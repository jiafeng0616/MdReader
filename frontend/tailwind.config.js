/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Solarized Light colors
        'solarized-light': {
          base: '#fdf6e3',
          text: '#657b83',
          emphasis: '#268bd2',
          accent: '#859900',
          warning: '#b58900',
          error: '#dc322f',
        },
        // Solarized Dark colors
        'solarized-dark': {
          base: '#002b36',
          text: '#839496',
          emphasis: '#268bd2',
          accent: '#859900',
          warning: '#b58900',
          error: '#dc322f',
        },
        // Monokai colors
        'monokai': {
          base: '#272822',
          text: '#f8f8f2',
          emphasis: '#f92672',
          accent: '#a6e22e',
          warning: '#f4bf75',
          error: '#f92672',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none', // 取消最大宽度限制，利用整个窗口
            // 完全禁用prose的表格相关样式
            table: false,
            thead: false,
            'thead th': false,
            'thead th:first-child': false,
            'thead th:last-child': false,
            tbody: false,
            'tbody td': false,
            'tbody td:first-child': false,
            'tbody td:last-child': false,
            'tbody tr': false,
            'tbody tr:nth-child(2n)': false,
            'tbody tr:first-child': false,
            'tbody tr:last-child': false,
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // 需要安装这个插件
  ],
}
