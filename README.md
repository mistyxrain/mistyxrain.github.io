# 提灯 · mistyxrain.github.io

用 [Astro](https://astro.build) 搭建的个人博客，网址：<https://mistyxrain.github.io/>

## 日常使用

### 本地预览

```bash
npm install      # 第一次使用时安装依赖
npm run dev      # 打开 http://localhost:4321 预览
```

### 写一篇新文章

在 `src/content/blog/` 下新建一个 `.md` 文件，**文件名就是网址**（建议用英文或拼音，如 `my-new-post.md` → `/post/my-new-post/`）。开头写上：

```markdown
---
title: "文章标题"
description: "一句话简介"
pubDate: 2026-10-11
tags: ["R", "随笔"]
heroImage: ../../assets/posts/my-new-post.jpg   # 封面图，可省略
draft: false                                    # 写 true 则暂不发布
---

正文用 Markdown 写。行内公式 $E=mc^2$，独立公式：

$$
\hat\beta = (X'X)^{-1}X'y
$$
```

- 封面图放在 `src/assets/posts/`，文中图片也可以放这里，用 `![说明](../../assets/posts/xxx.png)` 引用。
- 图片会在构建时自动压缩，不用手动处理。

### 发布

```bash
git add .
git commit -m "新文章：xxx"
git push
```

推送后 GitHub 会自动构建，1～2 分钟后网站更新（进度见仓库的 Actions 页）。

## 改哪里

| 想改的东西 | 文件 |
|---|---|
| 博客名、简介、邮箱、导航菜单 | `src/consts.ts` |
| 颜色、字体、排版 | `src/styles/global.css` |
| 首页 | `src/pages/index.astro` |
| 文章页布局 | `src/pages/post/[...slug].astro` |
| "关于"页 | `src/content/blog/guan-yu-wo.md` |

## 评论与阅读量（Waline）

文章页底部的留言区和标题下的"阅读 N"由 [Waline](https://waline.js.org) 提供。访客填昵称、邮箱即可留言，无需注册。
服务端需要自己部署一次（免费），部署好后把地址填进 `src/consts.ts` 的 `WALINE_SERVER`。

1. 用 GitHub 账号登录 <https://vercel.com>。
2. 打开 <https://vercel.com/new/clone?repository-url=https://github.com/walinejs/waline/tree/main/example>，按提示创建项目。
3. 在 Vercel 项目里：Storage → Create Database → 选 **Neon**（免费的 PostgreSQL）→ 连接到这个项目。
4. 打开 Neon 控制台的 SQL Editor，执行 [waline.pgsql](https://github.com/walinejs/waline/blob/main/assets/waline.pgsql) 里的内容建表。
5. 回到 Vercel：Deployments → 最新一次 → Redeploy。
6. 访问 `https://你的项目.vercel.app/ui/register` 注册——**第一个注册的账号就是管理员**，可以审核、删除、回复评论。
7. 想在有人留言时收到邮件：在 Vercel 的 Settings → Environment Variables 里配置 `SMTP_SERVICE`、`SMTP_USER`、`SMTP_PASS`、`AUTHOR_EMAIL` 等（见 Waline 文档"评论通知"）。

> 注意：`*.vercel.app` 在国内访问不稳定。若国内读者看不到留言区，可在 Vercel 的 Settings → Domains 绑定一个自己的域名（如 `comment.你的域名.com`），再把 `WALINE_SERVER` 改成它。
