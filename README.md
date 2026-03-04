<div align="center">

# 💩 DopaGut (多巴胺肠道追踪器)

*"记录每一次畅快淋漓的释放..."*

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-CDN-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)

</div>

## 📖 关于项目 (About)

**DopaGut** 是一款聚焦于肠道健康记录与趣味打卡的 Web App，采用了极具辨识度的 **Neo-Brutalism (新粗野主义)** 设计风格。不仅仅是记录排便的时间和状态，还能让你加入“拉屎圈子”，解锁奇葩成就，在朋友间比拼“击败了多少圈内用户”。

## ✨ 核心特性 (Features)

- 🚽 **快速记录**：使用直观的滑块（布里斯托大便分类法）、颜文字记录你的时长、形态和心情。
- 🏆 **趣味成就系统**：解锁“闪电战”、“拉锯战”、“便秘斗士”等十余种趣味成就。
- 📊 **多维度统计**：数据追踪与可视化面板（卡片、日历、总天数图表等），了解你的肠道规律。
- 🤝 **“拉屎圈”社交**：通过邀请码加入好友圈子，匿名比拼排便频率！
- 🔐 **完整的用户系统**：基于 Supabase 的安全鉴权（邮箱注册/登录、OTP 找回密码）。
- 🌍 **双语支持**：完整的中英双语 (i18n) 界面随意切换。
- 📱 **PWA 友好**：支持保存到手机桌面，体验宛如原生 App，附带离线提示功能。
- 🕶️ **开发者控制台**：内置管理员专用的作弊与数据调试界面（需白名单）。

## 📸 界面预览 (Screenshots)

*(提示：在这边替换你的项目截图)*
| 登录 / 注册 | 记录页 | 数据日报 |
| :---: | :---: | :---: |
| <img src="https://via.placeholder.com/300x600/FAFF00/000000?text=Login+Screen" width="200" /> | <img src="https://via.placeholder.com/300x600/FAFF00/000000?text=Tracker+Screen" width="200" /> | <img src="https://via.placeholder.com/300x600/FAFF00/000000?text=Dashboard+Screen" width="200" /> |
| **成就大厅** | **世界拉屎地图** | **圈子排行榜** |
| <img src="https://via.placeholder.com/300x600/FAFF00/000000?text=Achievements+Screen" width="200" /> | <img src="https://via.placeholder.com/300x600/FAFF00/000000?text=Map+Screen" width="200" /> | <img src="https://via.placeholder.com/300x600/FAFF00/000000?text=Leaderboard" width="200" /> |

## 🛠️ 技术栈 (Tech Stack)

- **前端框架**: React 19 + TypeScript + Vite
- **UI 样式**: Tailwind CSS (CDN 版) + 纯 CSS 动画库
- **后端 / 数据库**: Supabase (PostgreSQL + RLS Auth + RPC)
- **部署环境**: [建议填入你打算部署的平台，如 Vercel/Netlify]

## 🚀 本地运行 (Development)

1. 克隆项目
```bash
git clone https://github.com/NekosharkOvO/Dopagut.git
cd Dopagut
```

2. 安装依赖
```bash
npm install
```

3. 配置 Supabase 环境变量
在项目根目录创建 `.env.local` 文件，并填入您的 Supabase 项目信息：
```env
VITE_SUPABASE_URL=你的Supabase后端URL
VITE_SUPABASE_ANON_KEY=你的Supabase公钥
```

4. 启动开发服务器
```bash
npm run dev
```

## 📜 开源协议 (License)

本项目采用 **AGPL-3.0** 协议开源。
您可以自由学习、使用、修改本项目的代码，但**任何基于本项目的分发或通过网络提供的商业/非商业服务，都必须同样开源代码。**

Copyright © 2026 NEKOSHARK
