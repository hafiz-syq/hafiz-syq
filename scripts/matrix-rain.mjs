// Regenerates assets/matrix-rain.svg: an animated "code rain" banner.
// GitHub READMEs run no JavaScript, so the motion is CSS @keyframes inside the SVG.
const seed = Number(process.argv[2] ?? Date.now() % 100000);
let s = seed >>> 0 || 1;
const rnd = () => {
  s ^= s << 13; s >>>= 0;
  s ^= s >> 17;
  s ^= s << 5; s >>>= 0;
  return s / 4294967296;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];

const W = 1280, H = 240, STEP = 22, TRACK = 20, TRAIL = 12;
const GLYPHS = '0123456789ABCDEF<>/\|*+-=%$#[]{}();:~^&';
const HEAD = '#9BFFC0', BODY = '#00FF41', TAIL = '#046A1F';

const esc = (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);

// Eight prebuilt trails, reused across the width so the file stays small.
const templates = [];
for (let t = 0; t < 8; t++) {
  const glyphs = Array.from({ length: TRAIL }, () => esc(pick([...GLYPHS])));
  const spans = glyphs
    .map((g, i) => {
      const fill = i === 0 ? HEAD : i < 3 ? BODY : TAIL;
      const opacity = Math.max(0.05, 1 - i * 0.11).toFixed(2);
      const weight = i === 0 ? ' font-weight="bold"' : '';
      return `<text y="${i * STEP}" fill="${fill}" opacity="${opacity}"${weight}>${g}</text>`;
    })
    .join('');
  templates.push(`<g id="t${t}">${spans}</g>`);
}

const columns = [];
for (let x = 6, i = 0; x < W - 10; x += TRACK, i++) {
  const dur = (4 + rnd() * 6).toFixed(2);
  const delay = (-rnd() * 12).toFixed(2);
  const op = (0.35 + rnd() * 0.65).toFixed(2);
  const scale = (0.7 + rnd() * 0.5).toFixed(2);
  columns.push(
    `<use href="#t${i % 8}" x="${x}" style="--d:${dur}s;--y:${delay}s;--o:${op};--k:${scale}"/>`
  );
}

// One column that spells the handle instead of random glyphs. It holds position
// and pulses, because a falling column is legible for less than a second.
// The x lives on each <text>: a CSS transform on the group would override the
// transform attribute rather than add to it.
const sig = 'hafiz-syq';
const sigX = Math.round(W * 0.5);
const sigTop = Math.round((H - sig.length * STEP) / 2);
const sigSpans = [...sig]
  .map((c, i) => {
    const fill = i === 0 || i === sig.length - 1 ? '#E8FFEE' : HEAD;
    const opacity = (0.9 - i * 0.05).toFixed(2);
    return `<text x="${sigX}" y="${sigTop + i * STEP}" fill="${fill}" opacity="${opacity}" font-weight="bold">${c}</text>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Green code falling down a black terminal screen">
<title>Code rain</title>
<style>
  .drop { animation: fall var(--d) linear infinite; animation-delay: var(--y); opacity: var(--o); }
  .sig  { animation: pulse 5.5s ease-in-out infinite; }
  .rain { animation: flicker 6s ease-in-out infinite; }
  @keyframes fall {
    from { transform: translateY(${-TRAIL * STEP}px) scale(var(--k, 1)); }
    to   { transform: translateY(${H}px) scale(var(--k, 1)); }
  }
  @keyframes pulse { 0%,100% { opacity: .9 } 45% { opacity: .2 } 55% { opacity: .75 } }
  @keyframes flicker { 0%,100% { opacity: 1 } 47% { opacity: .82 } 49% { opacity: 1 } 73% { opacity: .9 } }
  @media (prefers-reduced-motion: reduce) {
    .drop, .sig, .rain { animation: none; }
    .drop { opacity: .55; }
  }
</style>
<rect width="${W}" height="${H}" fill="#020604"/>
<defs>${templates.join('')}</defs>
<g class="rain" font-family="monospace" font-size="20" text-anchor="middle">
  <g>${columns.join('')}</g>
  <g class="sig">${sigSpans.replace(/^/, '')}</g>
</g>
<rect width="${W}" height="${H}" fill="url(#v)"/>
<defs>
  <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#020604" stop-opacity=".45"/>
    <stop offset=".22" stop-color="#020604" stop-opacity="0"/>
    <stop offset=".78" stop-color="#020604" stop-opacity="0"/>
    <stop offset="1" stop-color="#020604" stop-opacity=".45"/>
  </linearGradient>
</defs>
</svg>
`;

const out = svg
  .replace(/<use href="#t(\d)" x="(\d+)" style="([^"]*)"/g, (m, t, x, st) =>
    `<use class="drop" href="#t${t}" x="${x}" style="${st}"`
  );

process.stdout.write(out);
