// 提灯 · 本地写作工具
// 只读写 src/content/blog/*.md、src/assets/posts/<slug>/、public/files/<slug>/，不依赖 Astro 内部代码。
// 启动：双击博客根目录的「写博客.bat」，或 npm run write

import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import { pinyin } from 'pinyin-pro';
import YAML from 'yaml';

const PORT = 4400;
const PREVIEW_PORT = 4321;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const POSTS_DIR = path.join(ROOT, 'src/content/blog');
const IMG_DIR = path.join(ROOT, 'src/assets/posts');
const FILE_DIR = path.join(ROOT, 'public/files');
// 新文章（导入的、未保存的）的图片和附件先放这里，不会被发布；点「保存」才移到正式位置
const STAGE_DIR = path.join(HERE, '.staging');
const stageImg = (key) => path.join(STAGE_DIR, key, 'img');
const stageFile = (key) => path.join(STAGE_DIR, key, 'files');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg']);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

// ---------- 文章读写 ----------

function parsePost(text) {
	const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!m) return { data: {}, body: text };
	return { data: YAML.parse(m[1]) ?? {}, body: m[2].replace(/^\r?\n/, '') };
}

function serializePost(d, body) {
	const fm = {
		title: d.title,
		description: d.description || '',
		pubDate: d.pubDate,
		...(d.updatedDate ? { updatedDate: d.updatedDate } : {}),
		...(d.heroImage ? { heroImage: d.heroImage } : {}),
		tags: d.tags || [],
		...(d.draft ? { draft: true } : {}),
	};
	const doc = new YAML.Document(fm);
	doc.get('tags', true).flow = true; // tags: [R, matlab]
	return `---\n${doc.toString({ lineWidth: 0, flowCollectionPadding: false })}---\n\n${body.trim()}\n`;
}

const postFile = (slug) => path.join(POSTS_DIR, `${slug}.md`);

function listPosts() {
	return fs
		.readdirSync(POSTS_DIR)
		.filter((f) => f.endsWith('.md'))
		.map((f) => {
			const slug = f.slice(0, -3);
			const { data } = parsePost(fs.readFileSync(postFile(slug), 'utf8'));
			return {
				slug,
				title: data.title || slug,
				pubDate: String(data.pubDate || ''),
				tags: data.tags || [],
				draft: !!data.draft,
				heroImage: data.heroImage || '',
			};
		})
		.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
}

function readPost(slug) {
	const { data, body } = parsePost(fs.readFileSync(postFile(slug), 'utf8'));
	return {
		slug,
		title: data.title || '',
		description: data.description || '',
		pubDate: String(data.pubDate || ''),
		updatedDate: data.updatedDate ? String(data.updatedDate) : '',
		tags: data.tags || [],
		draft: !!data.draft,
		heroImage: data.heroImage || '',
		body,
	};
}

// 新文章保存时：把临时区里的图片/附件移到正式位置；网址名改过的话同时改写正文里的路径
function moveAssets(from, to, post) {
	for (const [src, dst] of [[stageImg(from), path.join(IMG_DIR, to)], [stageFile(from), path.join(FILE_DIR, to)]]) {
		if (!fs.existsSync(src)) continue;
		fs.mkdirSync(dst, { recursive: true });
		for (const f of fs.readdirSync(src)) fs.renameSync(path.join(src, f), path.join(dst, f));
	}
	fs.rmSync(path.join(STAGE_DIR, from), { recursive: true, force: true });
	if (from === to) return;
	const swap = (s) =>
		s.replaceAll(`assets/posts/${from}/`, `assets/posts/${to}/`).replaceAll(`/files/${from}/`, `/files/${to}/`);
	post.body = swap(post.body);
	post.heroImage = swap(post.heroImage || '');
}

function savePost(slug, p) {
	if (!SLUG_RE.test(slug)) throw httpError(400, '网址名只能用小写字母、数字和短横线');
	if (!p.title?.trim()) throw httpError(400, '标题不能为空');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(p.pubDate || '')) throw httpError(400, '日期格式应为 2026-10-11');
	if (p.isNew && fs.existsSync(postFile(slug))) throw httpError(409, `已有网址名为「${slug}」的文章，请换一个`);
	if (p.isNew && p.assetSlug && SLUG_RE.test(p.assetSlug)) moveAssets(p.assetSlug, slug, p);
	const tags = [...new Set((p.tags || []).map((t) => String(t).trim()).filter(Boolean))];
	fs.writeFileSync(postFile(slug), serializePost({ ...p, title: p.title.trim(), tags }, p.body || ''));
}

// ---------- 思源 zip 导入 ----------

function slugify(title) {
	const s = pinyin(title, { toneType: 'none', type: 'array', nonZh: 'consecutive' })
		.join('-')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60)
		.replace(/-+$/, '');
	return s || `post-${Date.now()}`;
}

function uniqueSlug(base) {
	let s = base;
	for (let i = 2; fs.existsSync(postFile(s)) || fs.existsSync(path.join(IMG_DIR, s)); i++) s = `${base}-${i}`;
	return s;
}

// 文件名只保留安全字符；中文名之类换成编号，扩展名保留
function safeName(name, used, prefix) {
	const ext = path.extname(name).toLowerCase();
	let stem = path.basename(name, path.extname(name)).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
	if (!stem || stem.length < 2) stem = `${prefix}-${used.size + 1}`;
	let n = stem + ext;
	for (let i = 2; used.has(n); i++) n = `${stem}-${i}${ext}`;
	used.add(n);
	return n;
}

function importSiyuanZip(buf) {
	const entries = unzipSync(new Uint8Array(buf));
	const names = Object.keys(entries).filter((n) => !n.endsWith('/'));
	const mdName = names.find((n) => n.toLowerCase().endsWith('.md'));
	if (!mdName) throw httpError(400, 'zip 里没有找到 .md 文件，请确认是思源「导出 Markdown」得到的压缩包');
	const mdDir = mdName.includes('/') ? mdName.slice(0, mdName.lastIndexOf('/') + 1) : '';
	let md = new TextDecoder().decode(entries[mdName]).replace(/\r/g, '');

	const fallbackTitle = path.basename(mdName, '.md');
	const h1 = md.match(/^# (.+)$/m);
	const title = (h1 ? h1[1] : fallbackTitle).trim();
	const slug = uniqueSlug(slugify(title));
	fs.rmSync(path.join(STAGE_DIR, slug), { recursive: true, force: true });

	const usedImg = new Set();
	const usedFile = new Set();
	const written = new Map(); // zip 内路径 -> 文章里用的新路径
	const place = (rel) => {
		const key = path.posix.normalize(mdDir + rel);
		if (written.has(key)) return written.get(key);
		const data = entries[key];
		if (!data) return null;
		const ext = path.extname(key).toLowerCase();
		let link;
		if (IMAGE_EXT.has(ext)) {
			const n = safeName(path.basename(key), usedImg, 'img');
			fs.mkdirSync(stageImg(slug), { recursive: true });
			fs.writeFileSync(path.join(stageImg(slug), n), data);
			link = `../../assets/posts/${slug}/${n}`;
		} else {
			const n = safeName(path.basename(key), usedFile, 'file');
			fs.mkdirSync(stageFile(slug), { recursive: true });
			fs.writeFileSync(path.join(stageFile(slug), n), data);
			link = `/files/${slug}/${n}`;
		}
		written.set(key, link);
		return link;
	};
	const decode = (s) => {
		try {
			return decodeURIComponent(s);
		} catch {
			return s;
		}
	};

	// 思源文档开头的题头图 → 封面
	let heroImage = '';
	md = md.replace(/^\s*!\[[^\]]*\]\((assets\/[^)\s]+)\)\s*\n+/, (_, p) => {
		heroImage = place(decode(p)) || '';
		return '';
	});
	md = md
		.replace(/^# .*\n+/, '') // 标题已单独填写
		.replace(/^[\u200b\u200c\u200d\ufeff]+\s*$/gm, '') // 思源的零宽占位行
		.replace(/[\u200b\u200d\ufeff]/g, '')
		.replace(/\]\((https?:[^)\s]+)\s*\n\)/g, ']($1)') // 链接里多出的换行
		.replace(/\]\((assets\/[^)]+?)\)/g, (m, p) => {
			const link = place(decode(p.trim()));
			return link ? `](${link})` : m;
		})
		.replace(/(src=["'])(assets\/[^"']+)(["'])/g, (m, a, p, b) => {
			const link = place(decode(p));
			return link ? a + link + b : m;
		})
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	const plain = md
		.replace(/```[\s\S]*?```/g, '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[#>*`_|-]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	return {
		slug,
		assetSlug: slug,
		title,
		description: plain.slice(0, 100),
		pubDate: today(),
		tags: [],
		draft: false,
		heroImage,
		body: md,
		imported: { images: usedImg.size, files: usedFile.size, extraMd: names.filter((n) => n.endsWith('.md')).length - 1 },
	};
}

// ---------- 单个文件上传（封面、插图） ----------

function saveUpload(slug, name, buf, staged) {
	if (!SLUG_RE.test(slug)) throw httpError(400, '请先填写网址名');
	const ext = path.extname(name).toLowerCase();
	if (!IMAGE_EXT.has(ext)) throw httpError(400, '只支持图片文件');
	const dir = staged ? stageImg(slug) : path.join(IMG_DIR, slug);
	fs.mkdirSync(dir, { recursive: true });
	const used = new Set(fs.readdirSync(dir));
	const n = safeName(name, used, 'img');
	fs.writeFileSync(path.join(dir, n), buf);
	return { path: `../../assets/posts/${slug}/${n}` };
}

// ---------- git ----------

function run(cmd, args) {
	return new Promise((resolve) => {
		execFile(cmd, args, { cwd: ROOT, windowsHide: true, maxBuffer: 1 << 24 }, (err, stdout, stderr) =>
			resolve({ ok: !err, out: `${stdout}${stderr}` }),
		);
	});
}

// 全局代理若是 socks5，Git 的登录助手不支持，推送时临时换成同端口的 http 代理
async function proxyArgs() {
	const { out } = await run('git', ['config', '--get', 'http.proxy']);
	const m = out.trim().match(/^socks5h?:\/\/(.+)$/);
	return m ? ['-c', `http.proxy=http://${m[1]}`, '-c', `https.proxy=http://${m[1]}`] : [];
}

async function gitStatus() {
	const { out } = await run('git', ['-c', 'core.quotepath=false', 'status', '--porcelain', '-uall']);
	const changes = out.split('\n').filter(Boolean).map((l) => ({ code: l.slice(0, 2).trim(), file: l.slice(3).replace(/^"|"$/g, '') }));
	const posts = new Set();
	for (const c of changes) {
		const m = c.file.match(/content\/blog\/([^/]+)\.md$|assets\/posts\/([^/]+)\/|public\/files\/([^/]+)\//);
		if (m) posts.add(m[1] || m[2] || m[3]);
	}
	return { changes, posts: [...posts] };
}

async function publish(message) {
	const log = [];
	const step = async (args, label) => {
		const r = await run('git', args);
		log.push(`$ ${label}\n${r.out.trim()}`);
		return r;
	};
	await step(['add', '-A'], 'git add -A');
	const c = await step(['commit', '-m', message || `更新博客 ${today()}`], 'git commit');
	if (!c.ok && !/nothing to commit/.test(c.out)) return { ok: false, log: log.join('\n\n') };
	const p = await step([...(await proxyArgs()), 'push', 'origin', 'main'], 'git push');
	return { ok: p.ok, log: log.join('\n\n') };
}

// ---------- HTTP ----------

function httpError(status, message) {
	return Object.assign(new Error(message), { status });
}

function today() {
	const d = new Date();
	const p = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function readBody(req, limit = 200 * 1024 * 1024) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		req.on('data', (c) => {
			size += c.length;
			if (size > limit) reject(httpError(413, '文件太大'));
			else chunks.push(c);
		});
		req.on('end', () => resolve(Buffer.concat(chunks)));
		req.on('error', reject);
	});
}

const json = (res, status, data) => {
	res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
	res.end(JSON.stringify(data));
};

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml' };

async function handle(req, res) {
	// 只接受本机页面发来的请求，防止其他网站借浏览器调用本工具
	const host = req.headers.host || '';
	const origin = req.headers.origin;
	if (!/^(localhost|127\.0\.0\.1):\d+$/.test(host) || (origin && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) {
		return json(res, 403, { error: 'forbidden' });
	}

	const url = new URL(req.url, `http://${host}`);
	const p = url.pathname;
	const m = p.match(/^\/api\/posts\/([^/]+)$/);

	if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
		res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
		return res.end(fs.readFileSync(path.join(HERE, 'index.html')));
	}
	if (req.method === 'GET' && p === '/api/posts') return json(res, 200, listPosts());
	if (req.method === 'GET' && p === '/api/tags') {
		const count = {};
		for (const post of listPosts()) for (const t of post.tags) count[t] = (count[t] || 0) + 1;
		return json(res, 200, Object.keys(count).sort((a, b) => count[b] - count[a]));
	}
	if (req.method === 'GET' && m) {
		const slug = decodeURIComponent(m[1]);
		if (!SLUG_RE.test(slug) || !fs.existsSync(postFile(slug))) throw httpError(404, '文章不存在');
		return json(res, 200, readPost(slug));
	}
	if (req.method === 'PUT' && m) {
		const slug = decodeURIComponent(m[1]);
		const body = JSON.parse((await readBody(req)).toString('utf8'));
		savePost(slug, body);
		return json(res, 200, readPost(slug));
	}
	if (req.method === 'POST' && p === '/api/import') return json(res, 200, importSiyuanZip(await readBody(req)));
	if (req.method === 'POST' && p === '/api/upload') {
		return json(res, 200, saveUpload(url.searchParams.get('slug') || '', url.searchParams.get('name') || 'image.png', await readBody(req, 30 * 1024 * 1024), url.searchParams.get('new') === '1'));
	}
	if (req.method === 'GET' && p === '/api/image') {
		// 给界面显示缩略图：只允许读 src/assets/posts 下的图片
		const rel = (url.searchParams.get('path') || '').replace(/^(\.\.\/)+/, '');
		let file = path.resolve(ROOT, 'src', rel);
		if (!file.startsWith(IMG_DIR + path.sep)) throw httpError(404, 'not found');
		if (!fs.existsSync(file)) {
			const [key, ...rest] = path.relative(IMG_DIR, file).split(path.sep);
			file = path.join(stageImg(key), ...rest);
			if (!file.startsWith(STAGE_DIR + path.sep) || !fs.existsSync(file)) throw httpError(404, 'not found');
		}
		res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
		return res.end(fs.readFileSync(file));
	}
	if (req.method === 'GET' && p === '/api/status') return json(res, 200, await gitStatus());
	if (req.method === 'POST' && p === '/api/publish') {
		const { message } = JSON.parse((await readBody(req)).toString('utf8') || '{}');
		return json(res, 200, await publish(message));
	}
	if (req.method === 'GET' && p === '/api/config') return json(res, 200, { previewPort: PREVIEW_PORT });
	if (req.method === 'GET' && p === '/api/slug') return json(res, 200, { slug: uniqueSlug(slugify(url.searchParams.get('title') || '')) });
	throw httpError(404, 'not found');
}

// ---------- 启动 ----------

async function previewRunning() {
	try {
		const r = await fetch(`http://localhost:${PREVIEW_PORT}/`, { signal: AbortSignal.timeout(1500) });
		return r.ok;
	} catch {
		return false;
	}
}

fs.rmSync(STAGE_DIR, { recursive: true, force: true });

let preview;
if (!(await previewRunning())) {
	// 同时启动博客本地预览，界面上的「预览」按钮会打开它
	preview = spawn('npx', ['astro', 'dev', '--port', String(PREVIEW_PORT)], { cwd: ROOT, shell: true, stdio: 'ignore', windowsHide: true });
	const stop = () => {
		if (preview?.pid) {
			if (process.platform === 'win32') spawn('taskkill', ['/pid', String(preview.pid), '/t', '/f'], { stdio: 'ignore' });
			else preview.kill();
		}
		process.exit();
	};
	process.on('SIGINT', stop);
	process.on('SIGTERM', stop);
	process.on('SIGHUP', stop);
}

http
	.createServer((req, res) =>
		handle(req, res).catch((e) => {
			if (!e.status) console.error(e);
			json(res, e.status || 500, { error: e.message });
		}),
	)
	.listen(PORT, '127.0.0.1', () => {
		const url = `http://localhost:${PORT}/`;
		console.log(`\n  提灯 · 写作工具已启动：${url}\n  关闭这个窗口即可退出。\n`);
		if (process.argv.includes('--no-open')) return;
		const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
		if (process.platform === 'win32' && fs.existsSync(edge)) spawn(edge, [`--app=${url}`, '--window-size=1280,860'], { detached: true, stdio: 'ignore' }).unref();
		else if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
		else spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
	});
