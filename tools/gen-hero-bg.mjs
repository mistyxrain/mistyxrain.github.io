// 生成首页默认背景（程序绘制的插画），参考葛仙村千灯会实拍：
// 黑夜、满天又大又亮的孔明灯（近大远小）、金色喷泉烟花与礼花、远处亮灯的门楼、底部看灯的人群剪影
// 用法（在博客根目录）：node tools/gen-hero-bg.mjs "%CD%" public/images/hero-bg.jpg
// 改 seed 的数字可以得到不同的灯的分布
import { createRequire } from 'node:module';
import path from 'node:path';

const [blogDir, out] = process.argv.slice(2);
const sharp = createRequire(path.join(blogDir, 'package.json'))('sharp');

const W = 2400, H = 1200;
let seed = 20261;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const f = (n) => n.toFixed(1);

// ---------- 远处的门楼：两座亮灯的楼阁 + 中间拱门 ----------
function roof(x, y, w, h, lift) {
	const o = w * 0.1;
	return `M${f(x - w / 2 - o)},${f(y - lift)} Q${f(x - w / 2)},${f(y + 3)} ${f(x - w / 2 + o)},${f(y)} L${f(x + w / 2 - o)},${f(y)} Q${f(x + w / 2)},${f(y + 3)} ${f(x + w / 2 + o)},${f(y - lift)} Q${f(x + w * 0.28)},${f(y - h * 0.5)} ${f(x + w * 0.2)},${f(y - h)} L${f(x - w * 0.2)},${f(y - h)} Q${f(x - w * 0.28)},${f(y - h * 0.5)} ${f(x - w / 2 - o)},${f(y - lift)} Z`;
}
function tower(cx, baseY, s, tint) {
	let g = `<g transform="translate(${cx} ${baseY}) scale(${s})">`;
	let y = 0;
	for (const [i, w] of [130, 105, 80].entries()) {
		const bh = 46 - i * 6, bw = w * 0.72;
		g += `<rect x="${f(-bw / 2)}" y="${f(y - bh)}" width="${f(bw)}" height="${bh}" fill="${tint}" opacity="0.9"/>`;
		for (let c = 0; c < 4; c++) g += `<rect x="${f(-bw / 2 + 4 + c * (bw - 8) / 4)}" y="${f(y - bh + 8)}" width="${f((bw - 8) / 4 - 4)}" height="${bh - 16}" fill="#ffe3a0"/>`;
		y -= bh;
		g += `<path d="${roof(0, y, w, 26, 14)}" fill="#2a1430"/>`;
		g += `<path d="M${f(-w / 2 - w * 0.1)},${f(y - 14)} Q${f(-w / 2)},${f(y + 3)} ${f(-w / 2 + w * 0.1)},${f(y)} L${f(w / 2 - w * 0.1)},${f(y)} Q${f(w / 2)},${f(y + 3)} ${f(w / 2 + w * 0.1)},${f(y - 14)}" fill="none" stroke="#ffd98a" stroke-width="3"/>`;
		for (let k = 0; k <= 10; k++) g += `<circle cx="${f(-w * 0.4 + (k * w * 0.8) / 10)}" cy="${f(y + 4)}" r="2" fill="#fff0c0"/>`;
		y -= 26 * 0.8;
	}
	g += `<path d="M0,${f(y - 34)} L-5,${f(y)} L5,${f(y)} Z" fill="#ffd98a"/></g>`;
	return g;
}
function gate(cx, baseY, s) {
	const span = 300;
	let g = `<g transform="translate(${cx} ${baseY}) scale(${s})">`;
	// 两侧楼阁（偏粉紫的彩灯）
	g += `</g>${tower(cx - span * s, baseY, s, '#c2457a')}${tower(cx + span * s, baseY, s, '#b0417e')}<g transform="translate(${cx} ${baseY}) scale(${s})">`;
	// 中间拱桥形门楼
	g += `<path d="M${-span + 50},-60 Q0,-170 ${span - 50},-60 L${span - 50},-40 Q0,-150 ${-span + 50},-40 Z" fill="#d6304a"/>`;
	g += `<path d="M${-span + 50},-60 Q0,-170 ${span - 50},-60" fill="none" stroke="#ffd98a" stroke-width="4"/>`;
	for (let k = 0; k <= 24; k++) {
		const t = k / 24, x = -span + 50 + t * (2 * span - 100), y = -60 - Math.sin(t * Math.PI) * 55;
		g += `<circle cx="${f(x)}" cy="${f(y + 6)}" r="2.6" fill="#fff0c0"/>`;
	}
	g += `<rect x="-60" y="-138" width="120" height="34" rx="6" fill="#ffcf5e"/><rect x="-54" y="-132" width="108" height="22" rx="4" fill="#c2203a"/>`;
	g += `<rect x="${-span - 40}" y="-10" width="${2 * span + 80}" height="22" fill="#3a1420"/><path d="M${-span - 40},-10 H${span + 40}" stroke="#ffb05a" stroke-width="3"/>`;
	g += '</g>';
	return g;
}

// ---------- 烟花 ----------
function fountain(x, y, n, color) {
	let s = `<ellipse cx="${x}" cy="${y - 220}" rx="260" ry="300" fill="url(#fountainGlow)"/>`;
	for (let i = 0; i < n; i++) {
		const a = (-90 + (rnd() - 0.5) * 80) * (Math.PI / 180), len = 200 + rnd() * 340;
		const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len + len * 0.12;
		const cx = x + Math.cos(a) * len * 0.55, cy = y + Math.sin(a) * len * 0.62;
		s += `<path d="M${f(x + (rnd() - 0.5) * 60)},${f(y)} Q${f(cx)},${f(cy)} ${f(x2)},${f(y2)}" fill="none" stroke="${color}" stroke-width="${f(0.8 + rnd() * 1.6)}" opacity="${f(0.3 + rnd() * 0.55)}"/>`;
		s += `<circle cx="${f(x2)}" cy="${f(y2)}" r="${f(1 + rnd() * 2)}" fill="#fff6d8" opacity="${f(0.5 + rnd() * 0.5)}"/>`;
	}
	return s;
}
function burst(x, y, r, color, n) {
	let s = `<circle cx="${x}" cy="${y}" r="${r * 0.9}" fill="url(#burstGlow)" opacity="0.35"/>`;
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2 + rnd() * 0.05, len = r * (0.55 + rnd() * 0.45);
		const x1 = x + Math.cos(a) * len * 0.25, y1 = y + Math.sin(a) * len * 0.25;
		const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len + len * 0.08;
		s += `<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${color}" stroke-width="1.6" opacity="${f(0.45 + rnd() * 0.4)}"/>`;
		s += `<circle cx="${f(x2)}" cy="${f(y2)}" r="2" fill="#fff" opacity="0.8"/>`;
	}
	return s;
}

// ---------- 孔明灯 ----------
// 圆肩、略收腰的纸灯，整个灯身都亮，底口最亮
const LANTERN = `<symbol id="L" viewBox="-50 -66 100 132" overflow="visible">
	<path d="M-44,-36 Q-44,-64 0,-64 Q44,-64 44,-36 L36,52 Q0,60 -36,52 Z" fill="url(#paper)"/>
	<path d="M-44,-36 Q-44,-64 0,-64 Q44,-64 44,-36 L36,52 Q0,60 -36,52 Z" fill="url(#shade)"/>
	<ellipse cx="0" cy="52" rx="36" ry="6" fill="#ffe7a6"/>
	<ellipse cx="0" cy="50" rx="14" ry="5" fill="#fffbe6"/>
</symbol>`;

// 深度 z：0 = 很远（小），1 = 很近（大）。用最小间距避免重叠太多
const placed = [];
function inTitle(x, y) {
	return x > W * 0.07 && x < W * 0.46 && y > H * 0.26 && y < H * 0.74;
}
let tries = 0;
while (placed.length < 330 && tries++ < 60000) {
	const z = rnd();
	const size = 9 + 190 * Math.pow(z, 2.6);
	const x = rnd() * (W + 200) - 100;
	// 近处的大灯多在画面下半部和边缘，远处的小灯多在上半部
	const y = z > 0.6 ? H * (0.15 + rnd() * 0.95) : H * (rnd() * (0.35 + z * 0.5));
	if (inTitle(x, y) && (size > 40 || rnd() < 0.7)) continue; // 标题区只留少量小灯
	if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < (p.size + size) * 0.42)) continue;
	placed.push({ x, y, size, z, tilt: (rnd() - 0.5) * 10, tint: rnd() });
}
placed.sort((a, b) => a.z - b.z);

const lantern = (l) => {
	const w = l.size * 0.76, h = l.size;
	const glow = `<circle cx="${f(l.x)}" cy="${f(l.y + h * 0.15)}" r="${f(l.size * 0.85)}" fill="url(#glow)" opacity="${f(0.25 + l.z * 0.2)}"/>`;
	const dim = Math.min(1, 0.66 + l.z * 0.28 + (l.tint - 0.5) * 0.16); // 远处稍暗，每盏略有差别
	return `${glow}<use href="#L" x="${f(l.x - w / 2)}" y="${f(l.y - h / 2)}" width="${f(w)}" height="${f(h)}" transform="rotate(${f(l.tilt)} ${f(l.x)} ${f(l.y)})" opacity="${f(dim)}"/>`;
};

// ---------- 人群剪影 ----------
function crowd() {
	let s = '';
	for (let row = 0; row < 3; row++) {
		const baseY = H - 70 + row * 34, r = 20 + row * 5;
		for (let x = -20; x < W + 40; x += r * (1.5 + rnd() * 0.9)) {
			const hy = baseY - rnd() * 18;
			s += `<ellipse cx="${f(x)}" cy="${f(hy)}" rx="${f(r * 0.72)}" ry="${f(r * 0.86)}" fill="#08060a"/>`;
			s += `<ellipse cx="${f(x)}" cy="${f(hy + r * 2)}" rx="${f(r * 1.6)}" ry="${f(r * 1.4)}" fill="#08060a"/>`;
		}
	}
	return s;
}

let stars = '';
for (let i = 0; i < 60; i++) stars += `<circle cx="${f(rnd() * W)}" cy="${f(rnd() * H * 0.5)}" r="${f(0.6 + rnd())}" fill="#fff" opacity="${f(0.08 + rnd() * 0.25)}"/>`;

const GATE_X = W * 0.66, GATE_Y = H * 0.84;
const far = placed.filter((l) => l.z < 0.45), near = placed.filter((l) => l.z >= 0.45);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
	<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020205"/><stop offset="0.7" stop-color="#07060a"/><stop offset="1" stop-color="#140a08"/></linearGradient>
	<radialGradient id="smoke"><stop offset="0" stop-color="#6b6070" stop-opacity="0.35"/><stop offset="1" stop-color="#6b6070" stop-opacity="0"/></radialGradient>
	<radialGradient id="gateGlow" cx="0.5" cy="0.6" r="0.5"><stop offset="0" stop-color="#ff9a5a" stop-opacity="0.35"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>
	<radialGradient id="fountainGlow"><stop offset="0" stop-color="#ffcf7a" stop-opacity="0.32"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
	<radialGradient id="burstGlow"><stop offset="0" stop-color="#ff7ab0" stop-opacity="0.6"/><stop offset="1" stop-color="#ff7ab0" stop-opacity="0"/></radialGradient>
	<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ef8a2c"/><stop offset="0.45" stop-color="#ffa63e"/><stop offset="0.85" stop-color="#ffc561"/><stop offset="1" stop-color="#ffdd8c"/>
	</linearGradient>
	<linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#a84612" stop-opacity="0.35"/><stop offset="0.25" stop-color="#a84612" stop-opacity="0"/>
		<stop offset="0.75" stop-color="#a84612" stop-opacity="0"/><stop offset="1" stop-color="#a84612" stop-opacity="0.35"/>
	</linearGradient>
	<radialGradient id="glow"><stop offset="0" stop-color="#ffab45" stop-opacity="0.6"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
	<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>
	${LANTERN}
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${stars}
<circle cx="${GATE_X}" cy="${H * 0.45}" r="520" fill="url(#smoke)"/>
<circle cx="${GATE_X - 260}" cy="${H * 0.3}" r="380" fill="url(#smoke)" opacity="0.6"/>
${burst(GATE_X + 330, H * 0.2, 230, '#ff86b8', 90)}
<g filter="url(#soft)">${fountain(GATE_X, GATE_Y - 230, 340, '#ffd58a')}</g>
<ellipse cx="${GATE_X}" cy="${GATE_Y - 60}" rx="560" ry="200" fill="url(#gateGlow)"/>
<g filter="url(#soft)" opacity="0.95">${far.map(lantern).join('')}</g>
${gate(GATE_X, GATE_Y, 1.35)}
${near.filter((l) => l.z < 0.75).map(lantern).join('')}
${crowd()}
${near.filter((l) => l.z >= 0.75).map(lantern).join('')}
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
console.log('wrote', out, 'lanterns:', placed.length);
