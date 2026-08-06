# 🇳🇿 新西兰多人协同旅行规划网页 NZ Trip Planner

> 基于 Vue3 + Vite + TypeScript + TailwindCSS + Supabase Realtime 的新西兰一站式旅行协作平台

---

## ✨ 功能清单

### 🧑‍🤝‍🧑 多人协同能力
- ✅ **零注册登录**：打开网页输入临时昵称即可使用
- ✅ **编辑/只读双模式**：防止同伴误修改
- ✅ **秒级实时同步**：基于 Supabase Realtime 订阅，全员即时看到变更
- ✅ **修改溯源**：自动记录每条数据的创建人、更新人、时间戳
- ✅ **云端自动存档**：所有数据实时写入 Supabase
- ✅ **离线缓存**：断网也能查看和编辑，联网自动同步
- ✅ **操作日志**：Dashboard 显示同伴最近动态

### 📅 每日行程规划
- ✅ 自定义起止日期，自动生成每日卡片
- ✅ **拖拽排序**：SortableJS 实现行程调整顺序
- ✅ 完整字段：时间段、地点、交通、餐饮、停留时长、备注、难易度
- ✅ **新西兰专属标签**：环岛/冰川/徒步/峡湾/海边/城市休闲/观星/温泉/酒庄/农场
- ✅ 每日专属备注、新西兰本地小知识

### 🎫 订票台账管理
- ✅ **7大订单分类**：国际机票/境内机票/酒店/租车/景点门票/徒步预约/轮渡票
- ✅ 完整字段：标题/订单号/时间/价格(NZD)/联系人/凭证上传/状态
- ✅ 状态流转：未预订 → 已预订 → 已付款 → 已核销（点击状态徽章切换）
- ✅ **临近提醒**：3天内使用订单自动高亮 + Dashboard 提醒
- ✅ 凭证上传：PDF/图片转 Base64 存储，一键下载

### 🌦️ 新西兰本地化天气
- ✅ **8大主流目的地**：奥克兰/惠灵顿/基督城/皇后镇/瓦纳卡/库克山/米尔福德峡湾/罗托鲁瓦
- ✅ 实时指标：温度/体感/风力/风向/湿度/降水概率/UV指数
- ✅ **未来10日预报** + 天气图标
- ✅ **智能出行建议**：雨天提示室内、高UV强制防晒、大风注意横风等
- ✅ MetService Point Forecast API 对接 + **Mock 兜底**（无 Key 也能用）
- ✅ 10分钟内存缓存 + localStorage 磁盘缓存 + 接口异常降级

### ⚠️ 出行注意事项
- ✅ 全局通用须知：入境禁忌/海关申报/靠左行驶/支付网络/紧急电话/露营规范
- ✅ 安全须知：徒步/冰川/潮汐/野生动物/南北岛温差
- ✅ 每日专属备注（按日期独立）
- ✅ **物资清单**：按分类勾选，进度条可视化，支持共用/个人归属，数量统计

### 🎁 辅助功能
- ✅ **一键导出 PDF**：jsPDF + html2canvas 生成完整旅行手册
- ✅ **离线缓存**：所有数据 localStorage 备份，断网可用
- ✅ **同伴留言板**：聊天室式交互，快捷短语
- ✅ Dashboard 总览：天数/订单/待办/天气/临近订单/动态日志
- ✅ 响应式：手机 TabBar + 桌面端横向 Tabs，刘海屏安全区适配

---

## 🛠️ 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Vue 3.4 + Composition API |
| 构建工具 | Vite 5 |
| 类型系统 | TypeScript 5.5 严格模式（无 any） |
| 样式 | TailwindCSS 3 + 自定义旅行主题色 |
| 状态管理 | Pinia 2 + 持久化插件 |
| 路由 | Vue Router 4（Hash 模式，静态托管友好） |
| 实时协同数据库 | Supabase（Postgres + Realtime） |
| 后端中转 | Node.js + Express（天气 API 跨域 + 校验） |
| 天气数据源 | 新西兰 MetService Point Forecast API（Mock 兜底） |
| 拖拽排序 | SortableJS |
| PDF 导出 | jsPDF + html2canvas |
| 日期处理 | Day.js |
| 部署 | Vercel 一键部署（Serverless + 静态） |

---

## 📁 项目结构

```
nz-trip-planner/
├── api/                         # Vercel Serverless 入口
│   └── index.ts                 # 包装 Express 为 serverless 函数
├── server/                      # Node.js 中转服务源码
│   ├── index.ts                 # Express 入口 + 静态托管
│   ├── routes/
│   │   └── weather.ts           # 天气接口路由（校验/缓存/批量）
│   └── services/
│       └── weatherService.ts    # MetService API 封装 + Mock 数据
├── supabase/
│   └── init.sql                 # 数据库初始化 SQL（3张表 + RLS + Realtime）
├── src/
│   ├── components/              # Vue 组件
│   │   ├── common/              # 通用组件：Modal/Toast/WeatherIcon
│   │   ├── icons/               # 内联 SVG 图标库（零依赖）
│   │   ├── layout/
│   │   │   └── AppLayout.vue    # 顶栏 + TabBar + 设置面板
│   │   ├── schedule/
│   │   │   └── ScheduleItemModal.vue  # 行程编辑弹窗
│   │   └── orders/
│   │       └── OrderItemModal.vue     # 订单编辑弹窗
│   ├── services/                # 数据服务
│   │   ├── supabase.ts          # Supabase 客户端 + Realtime 订阅 + CRUD
│   │   └── weather.ts           # 前端天气服务（多层缓存兜底）
│   ├── stores/                  # Pinia 状态
│   │   └── trip.ts              # 核心 Store：行程/订单/须知/留言/协同
│   ├── router/
│   │   └── index.ts             # 路由配置（6个页面）
│   ├── types/
│   │   └── index.ts             # 全局类型定义（无 any）
│   ├── utils/
│   │   ├── index.ts             # 通用工具：ID/日期/格式化/防抖
│   │   ├── constants.ts         # 常量：城市/标签/分类/存储 Key
│   │   └── exportPdf.ts         # PDF 导出工具
│   ├── views/                   # 6 个页面视图
│   │   ├── DashboardView.vue    # 🏠 行程总览
│   │   ├── ScheduleView.vue     # 📅 每日行程（拖拽排序）
│   │   ├── OrdersView.vue       # 🎫 订票台账
│   │   ├── WeatherView.vue      # 🌦️ 天气预报
│   │   ├── NoticeView.vue       # ⚠️ 出行须知 + 物资
│   │   └── ChatView.vue         # 💬 同伴留言板
│   ├── App.vue
│   ├── main.ts
│   ├── style.css                # TailwindCSS 入口 + 自定义组件类
│   ├── env.d.ts
│   └── shims-vue.d.ts
├── public/
│   └── favicon.svg              # 新西兰国旗渐变 Logo
├── index.html                   # Vite 入口 HTML（Noto Sans SC 字体）
├── vite.config.ts               # Vite 配置（代理/分块/别名）
├── tailwind.config.js           # Tailwind 主题（绿+蓝+橙 旅行配色）
├── postcss.config.js
├── tsconfig.json / .node.json / .server.json   # TS 三份配置
├── vercel.json                  # Vercel 部署配置
├── package.json                 # 依赖 + 脚本
├── .env.example                 # 环境变量模板
└── .gitignore
```

---

## 🚀 本地启动步骤

### 前置要求
- Node.js ≥ 18
- npm 或 pnpm

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（可选，不配置也能跑 Mock 模式）
cp .env.example .env
# 编辑 .env 填入：
#   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY（开启协同需要）
#   VITE_METSERVICE_API_KEY（真实天气需要，否则自动 Mock）

# 3. 初始化 Supabase（开启协同功能才需要）
#    登录 Supabase 控制台 → 新建项目 → SQL Editor
#    将 supabase/init.sql 内容全部粘贴执行

# 4. 启动开发（前端 + 后端 同时启动）
npm run dev
#   → 前端：http://localhost:5173
#   → 后端：http://localhost:3001
#   → 健康检查：http://localhost:3001/api/health
#   → 天气接口：http://localhost:3001/api/weather?city=AKL

# 5. 打开浏览器访问 http://localhost:5173
#    输入昵称 → 开始规划 ✈️
```

### 其他命令
```bash
# 类型检查 + 构建生产前端
npm run build

# 预览构建产物
npm run preview

# 仅启动后端（生产）
npm run build:server && npm start
```

---

## ☁️ Vercel 一键部署

### 方式一：网页版导入
1. 将本项目推送到 GitHub 仓库
2. 登录 [vercel.com](https://vercel.com) → **Add New Project** → 导入仓库
3. Framework Preset 选 **Other**
4. Environment Variables 添加（可选但推荐）：
   | Key | Value | Required |
   |-----|-------|----------|
   | `VITE_SUPABASE_URL` | Supabase Project URL | 协同必填 |
   | `VITE_SUPABASE_ANON_KEY` | Supabase Anon Public Key | 协同必填 |
   | `VITE_METSERVICE_API_KEY` | MetService API Key | 真实天气 |
5. 点击 **Deploy**，等待 2-3 分钟即可 🎉

### 方式二：Vercel CLI
```bash
npm i -g vercel
vercel        # 首次部署，按提示选择项目名、区域
vercel --prod # 生产环境部署
```

部署后访问 `https://<你的项目名>.vercel.app` 即可使用。

---

## 🗄️ 数据库表设计（3 张表）

执行 `supabase/init.sql` 自动创建：

### `travel_schedule`（行程表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | 主键 |
| `trip_id` | text | 行程房间ID（分享用） |
| `date` | text | YYYY-MM-DD |
| `items` | jsonb | 当日 ScheduleItem[] 数组 |
| `updated_by` | text | 最后修改人昵称 |
| `updated_at` | timestamptz | 自动更新时间 |
| **约束** | `unique(trip_id, date)` | |

### `travel_order`（订单台账表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | 主键 |
| `trip_id` | text unique | 行程房间ID |
| `orders` | jsonb | OrderItem[]（整体读写） |
| `updated_by/updated_at` | 同上 | |

### `travel_notice`（注意事项+留言）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | 主键 |
| `trip_id` | text unique | |
| `notice` | jsonb | NoticeData（全局/安全/每日/物资） |
| `messages` | jsonb | ChatMessage[] 留言数组 |
| `updated_by/updated_at` | 同上 | |

> 所有表已开启 **RLS + Realtime 订阅**，修改会秒级推送到所有在线用户。

---

## ✅ 功能验收清单

| # | 功能点 | 验收结果 |
|---|--------|----------|
| 1 | 首次进入输入昵称，支持编辑/只读双权限 | ✅ 已实现 |
| 2 | 所有修改秒级同步到其他浏览器标签/设备 | ✅ Supabase Realtime |
| 3 | 行程卡片支持拖拽调整顺序 | ✅ SortableJS |
| 4 | 新西兰专属 10 种标签可多选 | ✅ |
| 5 | 7 大订单分类 + 4 种状态流转（点徽章切换） | ✅ |
| 6 | 3 天内订单自动高亮提醒 | ✅ Dashboard + Orders |
| 7 | 8 个新西兰主流城市天气 + 10 日预报 | ✅ |
| 8 | 天气出行建议（雨/UV/风/温度） | ✅ 自动生成 |
| 9 | 无 MetService Key 时 Mock 数据兜底 | ✅ 南岛/北岛气候模拟 |
| 10 | 全局 5 项 + 安全 5 项须知可编辑 | ✅ |
| 11 | 物资清单勾选 + 进度条 + 分类筛选 | ✅ |
| 12 | 每日行程可添加独立备注 | ✅ |
| 13 | 一键导出综合 PDF（行程+订单+须知） | ✅ |
| 14 | 断网可编辑，联网自动同步 | ✅ offlineQueue |
| 15 | 留言板聊天室，支持快捷短语 | ✅ |
| 16 | 手机 TabBar + 桌面端 Tabs 双布局 | ✅ 响应式 |
| 17 | 每条数据溯源（创建人/更新人/时间） | ✅ 日志面板 |
| 18 | 凭证文件上传（≤3MB Base64）+ 下载 | ✅ |
| 19 | 无 Supabase 可降级纯本地模式 | ✅ 离线可用 |
| 20 | Vercel 一键部署（前后端一起托管） | ✅ vercel.json |

---

## 🌐 浏览器兼容

- Chrome / Edge / Safari / Firefox 最新 2 个版本
- iOS Safari 14+ / Android Chrome 90+
- 响应式断点：xs(380px) / sm(640) / md(768) / lg(1024)

---

## 📝 常见问题

**Q1：Supabase 不配置能用吗？**  
可以。应用会降级为纯 localStorage 本地模式，适合单人预览。多人协同必须配置 Supabase。

**Q2：天气数据一直是 Mock？**  
未配置 `VITE_METSERVICE_API_KEY` 时默认走 Mock（气候真实，非实时）。去 MetService 官网申请开发者 Key，配置后重启 dev 即可。

**Q3：多人怎么共用同一行程？**  
当前版本默认 trip_id = `nz-trip-demo-2024`（可在 `src/utils/constants.ts` 的 `DEFAULT_TRIP_ID` 修改）。所有部署在同一域名、同一 trip_id 的访问者会进入同一协同房间。

**Q4：导出 PDF 中文乱码？**  
本项目使用 html2canvas（截图转 PDF），不依赖字体嵌入，**不会乱码**。Chrome 浏览器最佳。

**Q5：上传的凭证文件会存在哪里？**  
订单凭证转为 Base64 存在 `travel_order.orders[].voucher.dataUrl`（Supabase Postgres JSONB）。单文件建议 ≤ 2MB，避免 Postgres 行过大。

---

<p align="center">
  <a href="https://vercel.com/new/clone">一键部署到 Vercel →</a>
  &nbsp;|&nbsp;
  Made with 🌿 for NZ 2024
</p>
