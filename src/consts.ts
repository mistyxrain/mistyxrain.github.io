// 全站通用信息。博客名、个签、邮箱、微信二维码在 src/site.json 里（写作工具的「站点设置」可直接修改）。
import site from './site.json';

export const SITE_TITLE = site.title;
export const SITE_DESCRIPTION = site.description;
export const AUTHOR = site.author;
export const EMAIL = site.email;
export const WECHAT_QR = site.wechatQr;
export const HERO_BG = site.heroBg; // 首页背景图，留空则不显示
export const HERO_BG_OPACITY = site.heroBgOpacity ?? 0.6; // 0～1
export const GITHUB = site.github;

// 评论 + 阅读量服务（Waline）的地址。部署好后把网址填在这里，例如 'https://xxx.vercel.app'。
// 留空则文章页不显示评论区和阅读量。
export const WALINE_SERVER = 'https://waline-chi-pink-92.vercel.app';

// 顶部导航
export const NAV = [
	{ href: '/', label: '首页' },
	{ href: '/archives/', label: '归档' },
	{ href: '/tags/', label: '标签' },
	{ href: '/post/guan-yu-wo/', label: '关于' },
];
