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
