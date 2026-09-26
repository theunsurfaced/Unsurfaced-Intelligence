/**
 * proof_read_sharp.mjs  --  arc 7.1: the photo quality law and the relay's
 * full-size second chance.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const fn = (name, next) => { const a = w.indexOf('function ' + name + '('); return w.slice(w.lastIndexOf('\n', a) + 1, w.indexOf(next, a)); };

const relaySrc = w.slice(w.indexOf('const READ_IMG = '), w.indexOf('async function readRoute('));
const pvSrc = fn('pvBlockedHost', 'function pvDecode(') + fn('pvDecode', 'function pvMeta(') + fn('pvMeta', 'function pvExtract(');
let store, rows, web, fetched;
const reset = () => { store = new Map(); rows = []; web = {}; fetched = []; };
const caches = { default: { match: async k => { const r = store.get(k.url); return r ? r.clone() : undefined; }, put: async (k, r) => { store.set(k.url, r); } } };
const fakeFetch = async (href) => { fetched.push(href); const h = web[href]; if (!h) throw new Error('offline');
  return new Response(h.body, { status: h.status || 200, headers: { 'content-type': h.type } }); };
const R = new Function('sbRest', 'caches', 'fetch', 'console', pvSrc + relaySrc + '; return { readImageRelay, readImgLarger };')(
  async () => rows, caches, fakeFetch, { log: () => {} });
const jpg = new Uint8Array([255, 216, 255, 1, 2, 3]);

ok(R.readImgLarger('https://www.billboard.com/wp-content/uploads/a.jpg?w=237&h=158&crop=1') === 'https://www.billboard.com/wp-content/uploads/a.jpg', 'S1 resize parameters are removed');
ok(R.readImgLarger('https://x.com/wp-content/uploads/a-300x200.jpg') === 'https://x.com/wp-content/uploads/a.jpg', 'S2 WordPress size suffix is removed');
ok(R.readImgLarger('https://x.com/a.jpg') === null && R.readImgLarger('https://x.com/a.jpg?id=7') === null, 'S3 nothing to remove: no second chance');

reset();
rows = [{ image_url: 'http://www.billboard.com/a.jpg?w=237', source_url: 'https://blocked.example.com/story' }];
web['https://www.billboard.com/a.jpg'] = { type: 'image/jpeg', body: jpg };
web['https://www.billboard.com/a.jpg?w=237'] = { type: 'image/jpeg', body: jpg };
let r = await R.readImageRelay('/img/s/739', {});
ok(r.status === 200 && r.headers.get('x-img-from') === 'full' && !fetched.includes('https://www.billboard.com/a.jpg?w=237'), 'S4 the full-size image is served before the stored thumbnail');

reset();
rows = [{ image_url: 'https://cdn.example.com/b.jpg?w=237', source_url: null }];
web['https://cdn.example.com/b.jpg?w=237'] = { type: 'image/jpeg', body: jpg };
r = await R.readImageRelay('/img/s/741', {});
ok(r.status === 200 && r.headers.get('x-img-from') === 'stored', 'S5 the stored image is still the last resort');
ok([...store.keys()].every(k => k.includes('/v2/s/')), 'S6 cache key v2: every photo cached small is fetched again');

ok(/var MIN = \{ cover: 1200, hero: 1000, wide: 520, strip: 420, thumb: 160, frame: 800 \}/.test(page), 'Q1 each slot has a minimum source width');
ok(/el\.naturalWidth < min\) \{ if \(!phNext\(el\)\) phGone\(el\)/.test(page), 'Q2 below the minimum: next candidate, then the type-only design');
ok(/\.ph-wait \{ visibility: hidden; \}/.test(page) && /class="ph ph-wait"/.test(page), 'Q3 a photo is hidden until it passes: nothing blurry flashes');
ok(/data-min="' \+ MIN\[slot \|\| "thumb"\]/.test(page) && !(page.match(/\bphoto\([^,()]*\)/g) || []).length, 'Q4 every photo names its slot');
ok(/document\.querySelector\("\.doc img\.ph-wait"\)/.test(page), 'Q5 Download PDF waits for every slot to settle');
ok(/im\.naturalWidth >= MIN\.frame/.test(page), 'Q6 social frames use only photos at least 800px wide');
ok(/cap\.innerHTML = capHtml\(s/.test(page) && /cvcredit/.test(page), 'Q7 captions and credits follow a swapped photo');
ok(/\?v=2/.test(page), 'Q8 the page asks for v2 photos, past any browser cache');
ok(!/—/.test(page.replace(/<style>[\s\S]*?<\/style>/, '')), 'Q9 no em dash in the page copy');
console.log(`\nproof_read_sharp: ${pass} checks PASS`);
