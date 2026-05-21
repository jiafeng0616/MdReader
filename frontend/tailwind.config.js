/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
