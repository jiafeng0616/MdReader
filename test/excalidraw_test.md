# 欢迎使用 MdReader

# Excalidraw 图表测试

## 手绘风格图表

```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "frame1",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100,
      "fillStyle": "hachure",
      "strokeWidth": 2,
      "strokeColor": "#1a1a1a",
      "backgroundColor": "#f5f5f5",
      "groupIds": [],
      "roundness": null
    },
    {
      "id": "text1",
      "type": "text",
      "x": 150,
      "y": 140,
      "width": 100,
      "height": 24,
      "text": "Hello World",
      "fontSize": 20,
      "fontFamily": 1,
      "strokeColor": "#1a1a1a",
      "groupIds": [],
      "textAlign": "center"
    },
    {
      "id": "arrow1",
      "type": "arrow",
      "x": 320,
      "y": 140,
      "width": 100,
      "height": 10,
      "strokeWidth": 2,
      "strokeColor": "#1a1a1a",
      "groupIds": [],
      "points": [
        [0, 0],
        [100, 0]
      ],
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "ellipse1",
      "type": "ellipse",
      "x": 450,
      "y": 100,
      "width": 100,
      "height": 60,
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeColor": "#1a1a1a",
      "backgroundColor": "#e0f2fe",
      "groupIds": [],
      "roundness": null
    },
    {
      "id": "line1",
      "type": "line",
      "x": 100,
      "y": 250,
      "width": 200,
      "height": 20,
      "strokeWidth": 2,
      "strokeColor": "#ef4444",
      "groupIds": [],
      "points": [
        [0, 0],
        [200, 20]
      ]
    }
  ],
  "appState": {
    "theme": "light",
    "viewBackgroundColor": "#ffffff"
  }
}
```

## 元素统计

该图表包含以下元素类型：
- Rectangle: 1
- Text: 1
- Arrow: 1
- Ellipse: 1
- Line: 1

**预期结果**:
- 显示 Excalidraw Diagram 预览区域
- 显示元素统计信息（Rectangles: 1, Texts: 1, Arrows: 1, Ellipses: 1, Lines: 1）
- 显示"View JSON"按钮
- 点击按钮可展开查看原始 JSON 代码