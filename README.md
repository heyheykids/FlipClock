# 翻页时钟

经典翻页时钟桌面应用，基于 Tauri v2 + HTML/CSS/JS 实现。

## 功能

- **当前时间**：12/24 小时制切换，秒显示开关
- **定时器**：设置目标时刻，到点黑灰闪烁提醒
- **倒计时**：时/分/秒倒计时，到点闪烁提醒
- **番茄钟**：工作/休息循环，统计完成个数
- **背景透明度**：10%–100% 可调，持久化保存
- **无边框窗口**：顶部拖拽，右键侧边栏切换模式
- **全屏切换**：F11 或窗口按钮

## 项目结构

```
Clock/
├── frontend/                    # 前端源码
│   ├── index.html               # 页面结构
│   ├── styles.css               # 样式（翻页动画 + 透明度变量）
│   ├── renderer.js              # 逻辑（4 种模式 + Tauri invoke 调用）
│   └── fonts/
│       └── LXGWWenKai-Regular.woff2  # 子集化字体（64KB）
├── src-tauri/                   # Tauri 后端源码
│   ├── Cargo.toml               # Rust 依赖配置
│   ├── Cargo.lock               # Rust 依赖锁文件
│   ├── build.rs                 # Tauri 构建脚本
│   ├── tauri.conf.json          # Tauri 应用配置（窗口/CSP/打包）
│   ├── src/
│   │   ├── main.rs              # 程序入口
│   │   └── lib.rs               # 窗口控制命令（最小化/关闭/全屏）
│   └── icons/                   # 应用图标
├── 翻页时钟.exe                  # 最终单文件可执行程序（约 3MB）
└── README.md                    # 本说明书
```

## 构建步骤

### 1. 安装环境依赖

需要以下三项（首次安装，之后无需重复）：

```powershell
# 1) Rust 工具链
winget install Rustlang.Rustup

# 2) MSVC C++ Build Tools + Windows SDK
winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.Windows11SDK.22621 --includeRecommendations --passive --wait --norestart"

# 3) Tauri CLI
npm install -g @tauri-apps/cli@^2
```

### 2. 构建打包

在项目根目录执行：

```powershell
cd C:\Users\WinPC\Desktop\Clock
npx tauri build
```

构建产物：
- **单文件 exe**：`src-tauri\target\release\flip-clock.exe`（约 3 MB，可直接复制到其他电脑运行）
- **安装包**：`src-tauri\target\release\bundle\nsis\翻页时钟_1.0.0_x64-setup.exe`

### 3. 直接使用

将 `翻页时钟.exe` 复制到任意电脑双击运行即可，无需安装。
唯一系统要求：Windows 10/11（自带 WebView2 Runtime）。

## 技术说明

- **前端**：原生 HTML/CSS/JS，无框架依赖
- **字体**：LXGW WenKai Regular，子集化后仅 64 KB（含数字+ASCII+UI 中文）
- **窗口控制**：前端通过 `window.__TAURI__.core.invoke()` 调用 Rust 命令
- **拖拽**：标题栏使用 `data-tauri-drag-region` 属性
- **透明度**：CSS 变量 `--bg-alpha` 控制 body 背景 alpha，localStorage 持久化
