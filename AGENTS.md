# AGENTS.md - 物值账 (Thing Worth Bills)

> 本文件面向 AI 编程助手，用于快速了解项目结构、技术栈和开发规范。

## 项目概述

**物值账**是一个用于记录和管理"值得花的钱"的全栈 Web 应用。核心功能是追踪已购物品的使用天数、计算每日使用成本，帮助用户评估消费价值。

### 核心功能模块

1. **物品管理** - 记录购买物品的名称、价格、购买日期、分类、购买渠道等信息
2. **价值分析** - 自动计算使用天数、日均成本，支持多维度排序查看
3. **资产管理** - 为物品关联图片（产品图、订单截图、教程等）和链接
4. **心愿墙** - 管理待购物品清单，设定目标价格和优先级
5. **会员库** - 追踪各类会员/订阅服务的到期时间、续费周期
6. **图库管理** - 集中管理所有上传的图片资源

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite |
| 后端 | Express.js (Node.js ES Modules) |
| 数据库 | PostgreSQL 14+ |
| 文件存储 | 阿里云 OSS |
| 包管理 | npm |

## 项目结构

```
thing-worth-bills/
├── src/                      # 前端源码
│   ├── App.jsx               # 根组件（含桌面端/移动端双模式路由）
│   ├── App.css               # 全局样式（CSS 变量定义主题）
│   ├── main.jsx              # 应用入口
│   ├── components/           # 可复用组件
│   │   ├── CustomDialog.jsx  # 自定义对话框
│   │   ├── VipLibraryPanel.jsx
│   │   └── WishBoardPanel.jsx
│   ├── context/
│   │   └── ItemContext.jsx   # React Context：物品/心愿/VIP 数据管理
│   ├── pages/                # 页面级组件
│   │   ├── AddItem.jsx       # 添加/编辑物品
│   │   ├── ItemList.jsx      # 物品列表（移动端卡片式）
│   │   ├── ItemDetail.jsx    # 物品详情
│   │   ├── Stats.jsx         # 统计页面
│   │   ├── WishList.jsx      # 心愿列表
│   │   ├── Data.jsx          # 数据管理（导入导出）
│   │   └── Gallery.jsx       # 图库页面
│   └── utils/
│       ├── api.js            # API 请求封装
│       └── calc.js           # 计算工具函数（天数、日均成本等）
│
├── server/                   # 后端源码
│   ├── index.js              # Express 服务入口
│   ├── config/
│   │   └── env.js            # 环境变量配置
│   ├── db/
│   │   ├── index.js          # PostgreSQL 连接池
│   │   └── schema.js         # 数据库表结构定义和初始化
│   ├── routes/               # API 路由
│   │   ├── items.js          # 物品 CRUD + 资产管理
│   │   ├── wishes.js         # 心愿墙 API
│   │   ├── vipMemberships.js # 会员库 API
│   │   ├── uploads.js        # 阿里云 OSS 上传
│   │   ├── health.js         # 健康检查
│   │   └── setup.js          # 数据库初始化 API
│   └── scripts/
│       └── init-db.js        # 数据库初始化脚本
│
├── index.html                # HTML 模板
├── vite.config.js            # Vite 配置（含代理）
├── package.json
├── .env.example              # 环境变量示例
└── dist/                     # 构建输出（前端生产包）
```

## 环境配置

### 必需环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# 应用基础配置
APP_NAME=ThingWorthBills
NODE_ENV=development
PORT=3001

# 数据库配置（必需）
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=thing_worth_bills
DB_SSL=false

# 阿里云 OSS（可选，用于图片上传）
OSS_REGION=oss-cn-shanghai
OSS_ACCESS_KEY_ID=your_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET=your_bucket
OSS_PUBLIC_URL=          # 自定义 CDN 域名（可选）
```

### 开发环境要求

- Node.js >= 18
- PostgreSQL >= 14
- （可选）阿里云 OSS 账号

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式（同时启动前端 + 后端）
npm run dev

# 单独启动
npm run dev:client    # 仅前端（Vite，端口 5173）
npm run dev:server    # 仅后端（Express，支持热重载，端口 3001）

# 数据库初始化
npm run db:init

# 生产构建
npm run build         # 构建前端到 dist/
npm run preview       # 预览生产构建

# 生产启动
npm run server        # 以普通模式启动后端
```

### 开发模式端口说明

- 前端开发服务器：`http://localhost:5173`
- 后端 API 服务：`http://localhost:3001`
- Vite 代理配置：`/api/*` 请求自动代理到后端

## 数据库架构

### 主要数据表

#### 1. items（物品表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| name | VARCHAR(255) | 物品名称 |
| price | NUMERIC(12,2) | 购买价格 |
| buy_date | DATE | 购买日期 |
| stop_date | DATE | 停用日期（null 表示仍在使用）|
| category | VARCHAR(100) | 分类 |
| purchase_channel | VARCHAR(255) | 购买渠道 |
| bundle_name | VARCHAR(255) | 捆绑包名称 |
| status | VARCHAR(20) | active / inactive |
| note | TEXT | 备注 |

#### 2. item_assets（物品资产表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| item_id | BIGINT | 关联物品 ID |
| asset_type | VARCHAR(50) | 类型：image, product_image, order_image, tutorial_image, tutorial, link |
| title | VARCHAR(255) | 标题 |
| url | TEXT | 链接地址 |

#### 3. wish_board_items（心愿墙表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| name | VARCHAR(255) | 心愿名称 |
| target_price | NUMERIC(12,2) | 目标价格 |
| priority | VARCHAR(20) | 优先级：low, medium, high |
| status | VARCHAR(20) | 状态：planning, watching, ready, purchased, archived |

#### 4. vip_memberships（会员库表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| name | VARCHAR(255) | 会员名称 |
| website | TEXT | 官网链接 |
| expire_at | DATE | 到期日期 |
| renewal_cycle | VARCHAR(50) | 续费周期 |
| auto_renew | BOOLEAN | 是否自动续费 |
| status | VARCHAR(20) | active, expiring, expired, urgent |

### 数据库初始化

```bash
npm run db:init
```

该命令会：
1. 创建所有表（如果不存在）
2. 创建更新触发器（自动更新 updated_at）
3. 创建索引优化查询
4. 如果表为空，插入示例种子数据

## API 规范

### 响应格式

所有 API 统一返回 JSON 格式：

```typescript
// 成功响应
{
  "success": true,
  "data": {...},      // 或 items, wishes 等具体字段
  "message": "..."    // 可选
}

// 错误响应
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"  // 开发环境
}
```

### 主要端点

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | /api/items | 获取所有物品 |
| POST | /api/items | 创建物品 |
| PUT | /api/items/:id | 更新物品 |
| PATCH | /api/items/:id/status | 更新物品状态（启用/停用）|
| DELETE | /api/items/:id | 删除物品 |
| POST | /api/items/:id/assets | 添加资产 |
| GET | /api/assets | 获取所有资产（支持筛选）|
| GET | /api/wishes | 获取心愿列表 |
| GET | /api/vip-memberships | 获取会员列表 |
| POST | /api/uploads/file | 上传文件到 OSS |

## 代码规范

### 前端规范

1. **组件组织**
   - 页面级组件放在 `src/pages/`
   - 可复用 UI 组件放在 `src/components/`
   - 数据逻辑通过 `ItemContext` 统一管理

2. **状态管理**
   - 使用 React Context + useState 进行全局状态管理
   - API 请求集中在 `src/utils/api.js`

3. **样式规范**
   - 使用 CSS 变量定义主题（`App.css` 顶部 `:root`）
   - 支持深色/浅色主题切换（`data-theme="dark"`）
   - 移动端和桌面端使用响应式或双模式设计

4. **工具函数**
   - `calc.js` 包含所有计算逻辑（天数、成本等）
   - 日期处理注意时区问题

### 后端规范

1. **模块化结构**
   - 路由按功能拆分（`routes/*.js`）
   - 数据库操作集中在 `db/` 目录

2. **数据映射**
   - 使用 `mapItemRow`, `mapAssetRow` 等函数转换数据库行到 API 响应
   - 蛇形命名（snake_case）转驼峰命名（camelCase）

3. **错误处理**
   - 统一返回 `{ success: false, message: "..." }` 格式
   - 使用 try-catch 包裹异步操作

4. **SQL 规范**
   - 使用参数化查询（`$1, $2...`）防止 SQL 注入
   - 复杂查询使用 `db/schema.js` 管理

## 双模式架构

应用支持两种界面模式：

1. **移动端（mobile）** - 卡片式布局，适合手机操作
2. **桌面端（desktop）** - 侧边栏导航，表格/网格布局，适合大屏

入口选择逻辑在 `App.jsx` 中，根据设备自动推荐合适模式。

桌面端标签页：
- `value` - 价值分析（物品卡片展示）
- `overview` - 总览统计
- `items` - 物品清单管理
- `gallery` - 图库
- `vip` - 会员库
- `wishes` - 心愿墙
- `shop` - 闲鱼铺（预留）

## 文件上传

### OSS 上传流程

1. 前端读取文件 → Base64 编码
2. 发送到 `/api/uploads/file`
3. 后端使用阿里云 OSS 签名直传
4. 返回可访问的 URL

### 文件大小限制

- 单文件最大 10MB
- 文件类型通过扩展名白名单校验
- 存储路径按日期组织：`thing-worth-bills/YYYY-MM-DD/`

## 开发注意事项

### 新增功能时

1. **后端**
   - 如需新表：在 `db/schema.js` 添加 CREATE TABLE 语句
   - 如需新接口：在 `routes/` 新建路由文件并在 `index.js` 注册
   - 运行 `npm run db:init` 更新本地数据库

2. **前端**
   - 新页面：在 `src/pages/` 创建组件
   - 新 API：在 `src/utils/api.js` 添加方法
   - 如需全局状态：在 `ItemContext.jsx` 添加

### 主题切换

应用支持深色/浅色主题：
- CSS 变量定义在 `:root` 和 `:root[data-theme='dark']`
- 用户偏好保存在 `localStorage`（key: `thing-worth-theme`）
- 切换时更新 `document.documentElement.setAttribute('data-theme', theme)`

### 日期处理

- 数据库使用 `DATE` 类型存储（无时区）
- API 返回 ISO 日期字符串（YYYY-MM-DD）
- 前端计算天数时注意时区偏差，使用 `formatDateOnly` 规范化

## 部署

### 生产构建

```bash
npm run build
```

生成 `dist/` 目录，包含：
- 优化后的 HTML/CSS/JS
- 静态资源（带哈希文件名）

### 部署方式

1. **分离部署**
   - `dist/` 托管到静态文件服务器（CDN/Nginx）
   - 后端单独部署，配置 `PORT` 环境变量
   - 前端 API 请求指向生产后端地址

2. **合并部署**
   - 配置 Express 提供 `dist/` 静态文件
   - 单服务部署

### 环境检查清单

- [ ] PostgreSQL 数据库已创建并运行
- [ ] 所有环境变量已配置
- [ ] OSS 配置完整（如需图片上传功能）
- [ ] `NODE_ENV=production`
- [ ] 数据库表已初始化

## 故障排查

### 常见问题

**数据库连接失败**
- 检查 `.env` 中 DB_HOST/DB_PORT/DB_USER/DB_PASSWORD
- 确认 PostgreSQL 服务已启动
- 检查防火墙设置

**文件上传失败**
- 检查 OSS 相关环境变量
- 确认 Bucket 权限设置为公共读
- 查看文件大小是否超过 10MB

**前端无法连接后端**
- 开发模式：Vite 代理自动处理，检查 `vite.config.js` 中的 proxy 配置
- 生产模式：确认 API 基础 URL 配置正确

### 调试技巧

- 后端日志：查看控制台输出
- 数据库查询：在 `db/index.js` 的 `query` 函数添加日志
- API 测试：直接访问 `http://localhost:3001/api/health`
