# TruthPad 官网（静态单页）

纯静态：直接双击 `index.html` 用浏览器打开即可，**不需要任何服务器、构建步骤或 Node.js**
（与应用核心"零 Node.js"的约束一致）。

## 文件

| 文件 | 说明 |
| --- | --- |
| `index.html` | 单页全部内容（上/中/英双语，默认中文） |
| `style.css` | 样式；颜色/圆角/字体直接沿用应用自身的主题 token（深色默认 + 浅色可切） |
| `app.js` | 约 70 行原生 JS：中/EN 切换、深/浅主题切换、构建命令复制。**禁用 JS 时页面默认深色 + 中文，仍完整可读** |
| `assets/logo.svg`、`assets/favicon.svg` | 纯路径绘制的手写 "T" 字标（不依赖字体） |
| `assets/shot-*.png` | 真机截图（1280×800：深色 / 浅色 / 汉堡菜单 / 设置页 / 安装器），由 `tools\shoot-web.ps1` 现场捕获，非设计稿 |

## 截图怎么来的

一条命令重拍全部配图（会临时切 config.ini 的工作区/主题，结束还原）：

```
powershell -File tools\shoot-web.ps1                      # 全部 5 张
powershell -File tools\shoot-web.ps1 -SkipSetup           # 先不动安装器
powershell -File tools\shoot-web.ps1 -SkipMenu -SkipSetup # 只要深/浅两张
```

- 演示工作区默认 `%TEMP%\TruthPad-demo`（`README.md` 里有 mermaid 与 KaTeX 公式，截图里才有料），
  可用 `-DemoRoot` 换成别的目录
- 前三张（含菜单）走 `PrintWindow(PW_RENDERFULLCONTENT)`，不依赖屏幕渲染；
  **菜单图只能屏幕拷贝**（弹出菜单是独立顶层窗口，且它遮挡的主窗口区域在 PrintWindow 里是未定义的）
- 安装器那张用 `--dir <临时目录>` 只开界面，不点「安装」就不会真装

## 说明

页面里的口号（Make Editing Great Again / Nobody knows editors better than me!）与
「真社交」风格卡片均为**玩梗**，页脚已注明；对比表的「某些编辑器」为泛指，不对任何
具体产品作事实断言。
