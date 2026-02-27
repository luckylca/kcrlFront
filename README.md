<p align="center">
  <h1 align="center">KCRL Front</h1>
  <p align="center">
    <strong>KCTRL 按键控制器的 Android 前端应用</strong>
  </p>
  <p align="center">
    基于 React Native 构建，配合 KCTRL Service 使用，<br/>
    实现安卓在 shizuku 或者 adb 权限下，自定义按键控制。
  </p>
</p>


---

## 📖 项目简介

**KCRL Front** 是 [KCTRL](https://github.com/luckylca/kcrlFront) 按键控制器系统的移动端配置工具（Android），配合 [KCTRL Service](https://github.com/IDlike32/kctrl_service/tree/master) 后端服务，让用户可以通过直观的图形界面完成以下工作：

- **监控**后端服务运行状态，一键启动 / 关闭
- **配置**硬件按键（`/dev/input/event*`）到 Shell 脚本的映射，实现自定义按键控制
- **编写**自动化 Shell 脚本，内置模板库
- **管理**输入设备路径，支持实时按键扫描
- **调节**按键触发时间阈值（单击 / 双击 / 短按 / 长按）
- **社区**分享脚本、主题、扩展等资源
- **个性化**主题色、深色模式、自定义壁纸

## ✨ 功能特性

### 🏠 仪表盘（首页）

- 大尺寸状态卡片，实时显示 KCTRL 后端服务状态（运行中 / 已停止）
- 点击卡片可一键启动或关闭后端服务
- 带水波纹动画的状态指示器
- 快速入口导航至按键配置等子功能

### ⌨️ 按键配置

- 从系统输入设备实时扫描物理按键，获取 keycode
- 为每个按键配置五种触发事件：
  - `onpress`（按下）、`click`（单击）、`dblclick`（双击）、`short_press`（短按）、`long_press`（长按）
- 每种事件可绑定一个 Shell 脚本
- 支持添加、删除按键映射

### 📝 脚本编辑器

- 可视化拖拽式脚本构建，基于 **步骤（Step）** 概念
- 内置丰富的脚本模板库
- 自动生成标准 Shell 脚本（`#!/system/bin/sh`）
- 脚本保存 / 加载 / 重命名 / 删除
- 脚本元数据支持导入还原

### 📱 设备路径管理

- 自动扫描系统所有 `/dev/input/event*` 输入设备
- 显示设备名称和路径
- 支持多设备选择
- 实时按键监听测试（Key Input Monitor）
- 支持按路径或按名称锁定设备

### ⏱️ 时间阈值配置

- 滑块式调节四项时间阈值：
  - 单击阈值、短按阈值、长按阈值、双击间隔
- 可视化时间轴展示各阈值关系

### 🌐 社区

- 浏览社区帖子，支持分类筛选（扩展 / 脚本 / 主题 / 帖子）
- 搜索功能
- 发布帖子，支持上传脚本文件和图片附件
- 帖子详情页，支持评论与回复

### 🎨 主题与个性化

- Material Design 3 (Material You) 设计风格
- 深色 / 浅色模式切换
- 自定义主题色
- 自定义背景壁纸及透明度调节

### ⚙️ 设置

- 日志记录开关
- 配置导出（ZIP 打包分享）
- 开发者选项
- 应用更新检查

## 🏗️ 技术栈

| 领域 | 技术 |
| --- | --- |
| **框架** | React Native 0.83 + TypeScript |
| **UI 组件库** | React Native Paper 5 (MD3) |
| **状态管理** | Zustand 5 + AsyncStorage 持久化 |
| **导航** | React Navigation 7（Native Stack + Bottom Tabs + PagerView） |
| **通信** | TCP Socket（`react-native-tcp-socket`）— 与本地 C++ 后端通信 |
| **文件系统** | react-native-fs — 读写配置文件和脚本 |
| **动画** | React Native Reanimated 4 + Animated API |
| **其他** | react-native-gesture-handler, react-native-share, react-native-zip-archive, react-native-image-picker, react-native-device-info |

## 📁 项目结构

```
kcrlFront/
├── App.tsx                          # 应用入口，主题 / 壁纸 / 导航容器
├── src/
│   ├── api/
│   │   ├── CPPAPISocket.ts          # TCP Socket 通信层（Shell 执行、密码认证）
│   │   ├── CPPAPIConfig.ts          # KCTRL 配置文件解析器（kctrl.conf ↔ 对象）
│   │   ├── OLAPI.ts                 # 社区 REST API（帖子 CRUD、更新检查）
│   │   └── devicesGetter.ts         # 通过 Shell 扫描 /dev/input 设备列表
│   ├── components/
│   │   └── CustomTabBar.tsx         # 自定义底部导航栏
│   ├── navigation/
│   │   └── index.tsx                # 路由定义（Stack + Tab）
│   ├── screens/
│   │   ├── MainScreens.tsx          # 主页面容器（PagerView + TabBar）
│   │   ├── HomeScreen.tsx           # 仪表盘 — 服务状态与快捷入口
│   │   ├── CommunityScreen.tsx      # 社区列表 — 帖子浏览与筛选
│   │   ├── SettingsScreen.tsx       # 设置页
│   │   ├── KeyConfigScreen.tsx      # 按键配置 — 按键扫描与事件映射
│   │   ├── ScriptConfigScreen.tsx   # 脚本编辑器 — 可视化脚本构建
│   │   ├── TimeConfigScreen.tsx     # 时间阈值配置
│   │   ├── DevicePathScreen.tsx     # 输入设备管理
│   │   ├── ThemeSettingsScreen.tsx  # 主题与壁纸设置
│   │   ├── CreatePostScreen.tsx     # 发布帖子
│   │   ├── PostDetailScreen.tsx     # 帖子详情与评论
│   │   ├── AboutScreen.tsx          # 关于页 — 版本信息与更新检查
│   │   └── DeveloperScreen.tsx      # 开发者选项
│   ├── store/
│   │   ├── useSettingStore.ts       # 设置状态（主题 + KCTRL 配置），自动同步到 kctrl.conf
│   │   ├── useScriptStore.ts        # 脚本状态（步骤 + 已保存脚本），自动同步到 .sh 文件
│   │   └── useUserStore.ts          # 用户状态（登录、频道列表）
│   └── utils/
│       ├── scriptGenerator.ts       # ScriptStep[] → Shell 脚本文本
│       ├── scriptParser.ts          # Shell 脚本文本 → ScriptStep[]（反解析）
│       └── request.ts               # Axios 实例（拦截器、Token 管理）
├── android/                         # Android 原生工程
├── package.json
└── tsconfig.json
```

## 🔧 架构说明

### 通信模型

- 通过 TCP 连接本地 C++ 后端，支持命令执行、服务状态查询
- **useSettingStore** 在状态变化时自动防抖写入 `kctrl.conf`
- **useScriptStore** 在脚本变化时自动防抖同步所有 `.sh` 文件到磁盘

### 数据持久化

| 数据 | 存储方式 |
| --- | --- |
| UI 设置（主题、壁纸等） | AsyncStorage（Zustand persist） |
| KCTRL 配置 | AsyncStorage + 自动同步到 `kctrl.conf` 文件 |
| 脚本步骤 | AsyncStorage + 自动同步到 `scripts/*.sh` 文件 |
| 用户信息 | AsyncStorage |

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20
- **Yarn**（项目强制使用 yarn，通过 `preinstall` 脚本限制）
- **Android SDK**（已配置 `ANDROID_HOME`）
- **React Native 开发环境**（参考 [官方文档](https://reactnative.dev/docs/set-up-your-environment)）

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

```bash
yarn start
```

### 构建运行（Android）

```bash
yarn android
```

## 📜 配置文件格式

应用生成的 `kctrl.conf` 配置文件示例：

如果有adb权限，可以自己设置，推荐使用管理器进行设置

```ini
# KCTRL 配置文件
# 格式: key=value

device=/dev/input/event3|/dev/input/event5
name=my_device
click_threshold=200
short_press_threshold=500
long_press_threshold=1000
double_click_interval=300
enable_log=0
cpu_affinity=0

# KEY735事件配置
script_735_click=play_pause.sh
script_735_long_press=next_track.sh
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

GPL-3.0
