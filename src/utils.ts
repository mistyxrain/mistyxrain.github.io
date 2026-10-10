import { getCollection } from 'astro:content';

export async function getPosts() {
	// 草稿只在本地预览（npm run dev）时显示，不会发布到网上
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function tagUrl(tag: string) {
	return `/tags/${encodeURIComponent(tag)}/`;
}

export function readingMinutes(body = '') {
	// 中文按字数、英文按词数粗略估算
	const cjk = (body.match(/[一-鿿]/g) || []).length;
	const words = (body.replace(/[一-鿿]/g, ' ').match(/\S+/g) || []).length;
	return Math.max(1, Math.round(cjk / 400 + words / 200));
}
