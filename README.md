# thing-worth-bills

一个用于记录和管理"值得花的钱"的全栈 Web 应用。

## 技术栈

- **前端**：React 18 + Vite
- **后端**：Express.js (Node.js)
- **数据库**：PostgreSQL
- **文件存储**：阿里云 OSS

## 项目结构

```
thing-worth-bills/
├── src/              # 前端 React 源码
├── server/           # 后端 Express 源码
│   └── scripts/
│       └── init-db.js  # 数据库初始化脚本
├── index.html
├── vite.config.js
├── .env.example      # 环境变量示例
└── package.json
```

## 快速开始

### 前置要求

- Node.js >= 18
- PostgreSQL >= 14
- （可选）阿里云 OSS 账号（用于文件上传功能）

### 1. 克隆项目

```bash
git clone https://github.com/65316571/thing-worth-bills.git
cd thing-worth-bills
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制示例文件并填写你的配置：

```bash
cp .env.example .env
```

然后编辑 `.env`：

```env
APP_NAME=ThingWorthBills
NODE_ENV=development
PORT=3001

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=thing_worth_bills
DB_SSL=false

# 阿里云 OSS（可选，用于文件上传）
OSS_REGION=oss-cn-shanghai
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
```

### 4. 初始化数据库

确保 PostgreSQL 已启动，并已创建数据库 `thing_worth_bills`，然后运行：

```bash
npm run db:init
```

### 5. 启动开发服务器

```bash
npm run dev
```

这会同时启动前端（Vite，默认 `http://localhost:5173`）和后端（Express，默认 `http://localhost:3001`）。

## 可用命令

|命令|说明|
|---|---|
|`npm run dev`|同时启动前端和后端开发服务器|
|`npm run dev:client`|仅启动前端 Vite 开发服务器|
|`npm run dev:server`|仅启动后端（支持热重载）|
|`npm run server`|以普通模式启动后端|
|`npm run db:init`|初始化数据库表结构|
|`npm run build`|构建前端生产包|
|`npm run preview`|预览生产构建结果|

## 部署

1. 构建前端：

```bash
npm run build
```

2. 将生成的 `dist/` 目录通过静态文件服务器托管，或配置 Express 直接提供静态文件服务。
    
3. 在生产环境中将 `NODE_ENV` 设为 `production`，并确保所有环境变量正确配置。
    

## License

MIT