/**
 * proof_preview.mjs — executable proof for SEAM:PREVIEW.
 * Extracts the EXACT shipped block from worker/src/index.js and drives it:
 *   G  SSRF guards   L  language plumbing   X  extraction   R  route behavior
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const a = w.indexOf('const PV_LANG_CODES');
const b = w.lastIndexOf('/*', w.indexOf(' * DAILY PIPELINE + SEAM:MODEL_POOL'));
const block = w.slice(a, b);

function build(stubs) {
  const f = new Function('json', 'caches', 'fetch', 'callModel', 'Request', 'Response',
    block + '; return { pvLangCode, pvBlockedHost, pvDecode, pvExtract, pvTranslate, previewRoute };');
  return f(stubs.json, stubs.caches, stubs.fetch, stubs.callModel, stubs.Request, stubs.Response);
}
const puts = [];
const stubs = {
  json: (o) => o,
  Request: function (u) { this.url = u; },
  Response: function (body, init) { this.body = body; this.init = init; this.text = async () => body; },
  caches: { default: { match: async () => null, put: async (k, r) => { puts.push({ k: k.url, body: r.body }); } } },
  fetch: async (url) => ({
    ok: true, url,
    headers: { get: (h) => h === 'content-type' ? 'text/html; charset=utf-8' : null },
    text: async () => FIXTURE,
  }),
  callModel: async (env, tier, msgs) => 'POOL:' + msgs[1].content,
};

const FIXTURE = `<!doctype html><html lang="hr"><head>
<title>Naslov iz titla</title>
<meta property="og:title" content="EU poja&#269;ava obranu">
<meta property="og:site_name" content="tportal">
<meta property="og:image" content="/img/lead.jpg">
</head><body>
<nav><p>Ovo je navigacija koja se mora ignorirati u potpunosti jer nije sadrzaj</p></nav>
<article>
<p>Prvi odlomak koji je dovoljno dugacak da prode filter i bude zadrzan u izvatku.</p>
<p>kratko</p>
<p>Drugi odlomak, takoder dovoljno dugacak da ostane u konacnom skupu odlomaka za prikaz.</p>
</article></body></html>`;

const api = build(stubs);

/* G: guards */
for (const h of ['localhost', '127.0.0.1', '10.0.0.5', '172.20.1.1', '192.168.1.9', '169.254.169.254', 'foo.internal', 'db.lan'])
  ok(api.pvBlockedHost(h) === true, 'G blocks ' + h);
ok(api.pvBlockedHost('elpais.com') === false && api.pvBlockedHost('news.ycombinator.com') === false, 'G public hosts pass');
const env = { AI: { run: async (m, p) => ({ translated_text: 'EN:' + p.text }) } };
ok((await api.previewRoute({ url: 'https://x/preview?url=' + encodeURIComponent('https://10.1.2.3/a') }, env, '')).error === 'blocked', 'G private IP refused at route');
ok((await api.previewRoute({ url: 'https://x/preview?url=' + encodeURIComponent('ftp://a.com/x') }, env, '')).error === 'blocked', 'G ftp scheme refused');
ok((await api.previewRoute({ url: 'https://x/preview?url=' + encodeURIComponent('https://a.com:8080/x') }, env, '')).error === 'blocked', 'G nonstandard port refused');

/* L: language plumbing */
ok(api.pvLangCode('croatian') === 'hr' && api.pvLangCode('korean') === 'ko' && api.pvLangCode('es') === 'es' && api.pvLangCode('') === null, 'L name-to-code map');
ok(api.pvDecode('&amp;&#233;&hellip;&nbsp;x') === '&\u00e9\u2026 x', 'L entity decode');

/* X: extraction */
const ex = api.pvExtract(FIXTURE, 'https://www.tportal.hr/vijesti/clanak');
ok(ex.title === 'EU poja\u010dava obranu', 'X og:title wins, entities decoded');
ok(ex.site === 'tportal', 'X site name');
ok(ex.image === 'https://www.tportal.hr/img/lead.jpg', 'X relative image absolutized');
ok(ex.lang === 'hr', 'X lang from html tag');
ok(ex.paragraphs.length === 2 && ex.paragraphs[0].startsWith('Prvi odlomak'), 'X paragraphs harvested, short + nav dropped');
const cjk = api.pvExtract('<html lang="ko"><body><article><p>\ubc18\ub3c4\uccb4 \uc2dc\uc7a5 \ubd84\uc11d \uacb0\uacfc \uc0bc\uc131\uacfc \uc5d0\uc2a4\ucf00\uc774\uc758 \uc8fc\uac00 \ud558\ub77d</p><p>Latin caption twenty ch</p></article></body></html>', 'https://fnnews.com/x');
ok(cjk.paragraphs.length === 1 && /\uae30|\ubc18/.test(cjk.paragraphs[0]), 'X CJK floor keeps dense paragraphs, latin floor still filters');

/* R: route behavior */
const full = await api.previewRoute({ url: 'https://x/preview?lang=en&url=' + encodeURIComponent('https://tportal.hr/clanak') }, env, '');
ok(full.ok && full.translated === true && full.title === 'EN:EU poja\u010dava obranu', 'R translates title via engine');
ok(full.paragraphs.length === 2 && full.paragraphs[1].startsWith('EN:Drugi'), 'R translates paragraphs in order');
ok(puts.length === 1 && JSON.parse(puts[0].body).translated === true, 'R caches the translated payload');
const meta = await api.previewRoute({ url: 'https://x/preview?meta=1&url=' + encodeURIComponent('https://tportal.hr/clanak') }, env, '');
ok(meta.ok && meta.image && meta.lang === 'hr' && !('paragraphs' in meta), 'R meta mode: image + lang only, no body');
const envDown = { AI: { run: async () => { throw new Error('ai down'); } } };
const fb = await api.previewRoute({ url: 'https://x/preview?lang=en&url=' + encodeURIComponent('https://tportal.hr/clanak2') }, envDown, '');
ok(fb.ok && fb.translated === true && fb.title.startsWith('POOL:'), 'R AI failure falls back to MODEL_POOL t1');
const api2 = build({ ...stubs, fetch: async (u) => ({ ok: true, url: u, headers: { get: () => 'image/png' }, text: async () => '' }) });
ok((await api2.previewRoute({ url: 'https://x/preview?url=' + encodeURIComponent('https://a.com/img.png') }, env, '')).error === 'not_html', 'R non-HTML rejected');

console.log('\nPREVIEW PROOF: ' + pass + '/' + pass + ' assertions PASS');
