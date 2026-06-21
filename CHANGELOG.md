# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 目录

- [1.2.0](#120---2026-06-20)
- [1.1.0](#110---2026-06-19)
- [1.0.2](#102---2026-05-22)
- [1.0.1](#101---2026-05-21)
- [1.0.0](#100---2026-01-20)
- [0.1.0](#010---2026-01-16)
- [0.0.1](#001---2026-01-15)

---

## [1.2.0] - 2026-06-20

### Added
- **主题选择功能扩展**: 新增三种主题 - Solarized Light、Solarized Dark、Monokai，支持六种主题切换
- **另存为 (Save As) 功能**: 支持将文档保存为新文件，默认文件名添加 `_update` 后缀
- **全宽显示功能**: 支持固定宽度 (A4) 和全宽两种显示模式切换
- **全屏模式**: 支持沉浸式全屏阅读，全屏时自动隐藏工具栏，右上角显示悬浮退出按钮
- **文档状态恢复**: 程序启动时自动恢复上次关闭前打开的文档列表和活动标签页
- **导出 HTML 功能**: 支持将 Markdown 文档导出为 HTML 文件，支持深色/浅色主题切换

### Changed
- **主题默认配色**: 默认主题保持为深蓝色 (Dark Blue)
- **文档状态保存优化**: 仅保存文件路径而非内容，显著减小配置文件大小

### Fixed
- 阅读模式下全宽切换不生效的问题
- 阅读模式下切换不即时生效的问题
- 浏览器全屏 API 在 Wails 应用中不生效的问题
- 全屏悬浮退出按钮点击不生效的问题

---

## [1.1.0] - 2026-06-19

### Added
- **图表渲染支持**: 支持 Mermaid 流程图、时序图、甘特图渲染
- **内部锚点链接跳转**: 支持 `[text](#heading-id)` 格式的页面内跳转
- **外部链接打开**: 点击外部链接可在默认浏览器中打开

### Changed
- 优化导出 HTML 的深色/浅色主题切换体验，添加平滑过渡动画

---

## [1.0.2] - 2026-05-22

### Fixed
- 修复中文图片文件名不能显示的 bug

---

## [1.0.1] - 2026-05-21

### Added
- **图片显示功能**: 支持在 Markdown 文档中显示图片
- **页面导航**: 添加页面导航功能，方便快速跳转
- **多语言版本**: 支持中文、英文等多语言界面
- **Ctrl+F 关键字搜索**: 支持在文档中搜索关键字
- **打印功能**: 支持打印文档，可通过打印功能转换为 PDF

---

## [1.0.0] - 2026-01-20

### Added
- **暗黑模式**: 支持暗黑模式切换
- **初始版本发布**: MdReader Markdown 阅读器基础功能

### Fixed
- 修复 HTML 显示异常问题
- 修复代码区域黑框 bug

---

## [0.1.0] - 2026-01-16

### Added
- **页面缩放功能**: 支持放大和缩小页面显示

---

## [0.0.1] - 2026-01-15

### Added
- 初始版本发布
- 基本的 Markdown 文件打开和阅读功能

---

[1.2.0]: https://github.com/wangbao0754/MdReader/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/wangbao0754/MdReader/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/wangbao0754/MdReader/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/wangbao0754/MdReader/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/wangbao0754/MdReader/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/wangbao0754/MdReader/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/wangbao0754/MdReader/releases/tag/v0.0.1