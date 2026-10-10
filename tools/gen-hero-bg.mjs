// 生成首页默认背景（程序绘制的插画），参考葛仙村千灯会实拍：
// 黑夜、满天橘红色的孔明灯（近大远小）、大片粉白/淡紫/金色的火星烟花和烟雾
// 用法（在博客根目录）：node tools/gen-hero-bg.mjs "%CD%" public/images/hero-bg.jpg
// 改 seed 的数字可以得到不同的灯和烟花分布
import { createRequire } from 'node:module';
import path from 'node:path';

const [blogDir, out] = process.argv.slice(2);
const sharp = createRequire(path.join(blogDir, 'package.json'))('sharp');

const W = 2400, H = 1200;
let seed = 8812;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const gauss = () => (rnd() + rnd() + rnd() + rnd() + rnd() + rnd() - 3) / 1.5;
const f = (n) => n.toFixed(1);

// 标题在左侧，这一块少放东西
const inTitle = (x, y) => x > W * 0.07 && x < W * 0.46 && y > H * 0.26 && y < H * 0.74;

// ---------- 烟雾 ----------
let smoke = '';
for (let i = 0; i < 26; i++) {
	const x = W * (0.38 + rnd() * 0.62), y = H * (0.08 + rnd() * 0.55), r = 140 + rnd() * 260;
	smoke += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#smoke)" opacity="${f(0.35 + rnd() * 0.5)}"/>`;
}

// ---------- 火星烟花：一团团密集的细小亮点 ----------
const SPARK = ['#ffffff', '#ffffff', '#fff7fd', '#fbe7ff', '#f3b6e6', '#e3b8ff', '#ffd9f0', '#fff2c6'];
function puff(cx, cy, r, n) {
	let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 1.3)}" fill="url(#burstGlow)"/>`;
	for (let i = 0; i < n; i++) {
		const a = rnd() * Math.PI * 2, d = r * Math.abs(gauss()) * 0.55; // 中心密、边缘自然散开
		const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d + d * d * 0.0015 * r * 0.02;
		if (inTitle(x, y) && rnd() < 0.9) continue;
		const big = rnd() < 0.06;
		s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(big ? 2.2 + rnd() * 1.8 : 0.7 + rnd() * 1.4)}" fill="${SPARK[Math.floor(rnd() * SPARK.length)]}" opacity="${f(0.4 + rnd() * 0.6)}"/>`;
	}
	return s;
}
// 烟花区域：右侧大片 + 上方一些 + 左上角一点，避开标题
let sparks = '';
for (let i = 0; i < 32; i++) {
	const region = rnd();
	const cx = region < 0.75 ? W * (0.5 + rnd() * 0.5) : region < 0.92 ? W * (0.25 + rnd() * 0.3) : W * rnd() * 0.2;
	const cy = region < 0.75 ? H * (0.06 + rnd() * 0.62) : H * (0.04 + rnd() * 0.2);
	if (inTitle(cx, cy)) continue;
	const r = 70 + rnd() * 150;
	sparks += puff(cx, cy, r, Math.round(r * r * 0.035));
}
// 少量更亮的星点
let stars = '';
for (let i = 0; i < 70; i++) {
	const x = W * (0.3 + rnd() * 0.7), y = H * rnd() * 0.7;
	stars += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(3 + rnd() * 3)}" fill="url(#star)"/>`;
}

// ---------- 孔明灯 ----------
// 圆肩纸灯；几种不同的橘红色，灯身上半偏深红、下半橘黄、底口一圈亮
const PAPERS = [
	['#b8320b', '#e8590c', '#ff8a1f', '#ffc078'],
	['#a8280a', '#d9480f', '#f76707', '#ffa94d'],
	['#c2410c', '#f97316', '#ff9a3c', '#ffd08a'],
	['#9a2a0e', '#e04e12', '#fd7e14', '#ffb366'],
];
const paperDefs = PAPERS.map((c, i) => `<linearGradient id="p${i}" x1="0" y1="0" x2="0" y2="1">
	<stop offset="0" stop-color="${c[0]}"/><stop offset="0.4" stop-color="${c[1]}"/><stop offset="0.82" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3]}"/></linearGradient>`).join('');
const SHAPE = 'M-44,-36 Q-44,-64 0,-64 Q44,-64 44,-36 L37,52 Q0,59 -37,52 Z';
const symbols = PAPERS.map((_, i) => `<symbol id="L${i}" viewBox="-50 -66 100 132" overflow="visible">
	<path d="${SHAPE}" fill="url(#p${i})"/>
	<path d="${SHAPE}" fill="url(#shade)"/>
	<path d="M-15,-63 L-12,55 M15,-63 L12,55" stroke="#7a1d05" stroke-width="1.4" opacity="0.28"/>
	<ellipse cx="0" cy="53" rx="37" ry="5" fill="#ffc46b"/>
	<ellipse cx="0" cy="50" rx="13" ry="4.5" fill="#ffe9b8"/>
</symbol>`).join('');
const placed = [];
let tries = 0;
while (placed.length < 300 && tries++ < 60000) {
	const z = rnd();
	const size = 9 + 175 * Math.pow(z, 2.7);
	const x = rnd() * (W + 200) - 100;
	const y = z > 0.6 ? H * (0.1 + rnd() * 1.0) : H * (rnd() * (0.4 + z * 0.55));
	if (inTitle(x, y) && (size > 36 || rnd() < 0.75)) continue;
	if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < (p.size + size) * 0.45)) continue;
	placed.push({ x, y, size, z, tilt: (rnd() - 0.5) * 16, paper: Math.floor(rnd() * PAPERS.length) });
}
placed.sort((a, b) => a.z - b.z);

const lantern = (l) => {
	const w = l.size * 0.76, h = l.size;
	let s = `<circle cx="${f(l.x)}" cy="${f(l.y + h * 0.2)}" r="${f(l.size * 0.75)}" fill="url(#glow)" opacity="${f(0.18 + l.z * 0.22)}"/>`;
	s += `<use href="#L${l.paper}" x="${f(l.x - w / 2)}" y="${f(l.y - h / 2)}" width="${f(w)}" height="${f(h)}" transform="rotate(${f(l.tilt)} ${f(l.x)} ${f(l.y)})" opacity="${f(0.7 + l.z * 0.3)}"/>`;

	return s;
};
const far = placed.filter((l) => l.z < 0.4), near = placed.filter((l) => l.z >= 0.4);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
	<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020203"/><stop offset="1" stop-color="#070506"/></linearGradient>
	<radialGradient id="smoke"><stop offset="0" stop-color="#7d8a86" stop-opacity="0.22"/><stop offset="1" stop-color="#7d8a86" stop-opacity="0"/></radialGradient>
	<radialGradient id="burstGlow"><stop offset="0" stop-color="#c47ab8" stop-opacity="0.16"/><stop offset="1" stop-color="#b06aa8" stop-opacity="0"/></radialGradient>
	<radialGradient id="star"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.3" stop-color="#fff6e0" stop-opacity="0.6"/><stop offset="1" stop-color="#fff6e0" stop-opacity="0"/></radialGradient>
	<radialGradient id="glow"><stop offset="0" stop-color="#ff7a1a" stop-opacity="0.55"/><stop offset="1" stop-color="#ff5a0a" stop-opacity="0"/></radialGradient>
	<linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#5a1404" stop-opacity="0.45"/><stop offset="0.28" stop-color="#5a1404" stop-opacity="0"/>
		<stop offset="0.72" stop-color="#5a1404" stop-opacity="0"/><stop offset="1" stop-color="#5a1404" stop-opacity="0.45"/>
	</linearGradient>
	<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.3"/></filter>
	<filter id="spark" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.5"/></filter>
	${paperDefs}
	${symbols}
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${smoke}
<g filter="url(#spark)">${sparks}</g>
${stars}
<g filter="url(#soft)">${far.map(lantern).join('')}</g>
${near.map(lantern).join('')}
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
console.log('wrote', out, 'lanterns:', placed.length);
