/**
 * proof_updates.mjs — executable proof for the three shipped updates.
 * Extracts the EXACT code from the deliverable files (no reimplementation)
 * and drives it with fixtures:
 *   P1  Worker enrichment: image/lang join by source_url, guard-nulled URLs get nothing
 *   P2  DAILY render: key visual escapes + degrades; foreign credit gets READ IN ENGLISH;
 *       English credit unchanged; XSS in image_url neutralized
 *   P3  RPS streak protocol: tie holds / loss breaks; highwater prevents dupes;
 *       unjoined match-end preserves the token; join-then-flush submits it
 */
import fs from 'fs';
const read = f => fs.readFileSync(f, 'utf-8');
let pass = 0; const ok = (cond, label) => { if (!cond) { console.error('FAIL:', label); process.exit(1); } pass++; console.log('  ok', label); };

/* ── P1: Worker enrichment (extract the exact block) ─────────────────── */
{
  const w = read('worker/src/index.js');
  const a = w.indexOf('const sigByUrl');
  const b = w.indexOf('});', w.indexOf('return { ...it, image_url')) + 3;
  const block = w.slice(a, b);
  const working = [
    { url: 'https://elpais.com/x', image: 'https://elpais.com/img.jpg', lang: 'Spanish' },
    { url: 'https://news.ycombinator.com/item?id=1', image: '', lang: 'English' },
    { url: 'https://evil.example/y', image: 'javascript:alert(1)', lang: 'French' },
  ];
  const clean = [
    { headline: 'A', source_url: 'https://elpais.com/x' },
    { headline: 'B', source_url: 'https://news.ycombinator.com/item?id=1' },
    { headline: 'C', source_url: null },                       // guard-nulled
    { headline: 'D', source_url: 'https://evil.example/y' },   // non-http image
  ];
  const enriched = new Function('working', 'clean', block + '; return enriched;')(working, clean);
  ok(enriched[0].image_url === 'https://elpais.com/img.jpg' && enriched[0].lang === 'spanish', 'P1 GDELT image+lang carried, lang lowercased');
  ok(enriched[1].image_url === null && enriched[1].lang === 'english', 'P1 HN: no image, english lang');
  ok(enriched[2].image_url === null && enriched[2].lang === null, 'P1 guard-nulled URL attaches nothing');
  ok(enriched[3].image_url === null, 'P1 non-http image rejected');
}

/* ── P2: DAILY rendering (extract esc + the helper suite + renderItem) ── */
{
  const d = read('daily/index.html');
  const escFn = d.slice(d.indexOf('function esc(s)'), d.indexOf('function el(id)'));
  const a = d.indexOf('// English-first house');
  const endMark = d.indexOf('"</p></article>";', a);
  const helpers = d.slice(a, d.indexOf('}', endMark) + 1);
  const api = new Function(escFn + '\n' + helpers +
    '; return { renderItem, creditLine, isForeign, transUrl, keyVisual };')();
  const es = api.renderItem({ headline: 'H', take: 'T', lang: 'spanish',
    image_url: 'https://elpais.com/img.jpg', source_name: 'El País', source_url: 'https://elpais.com/x' }, 0);
  ok(es.includes('<figure class="keyvis"><img src="https://elpais.com/img.jpg"'), 'P2 key visual renders');
  ok(es.includes('loading="lazy"') && es.includes('referrerpolicy="no-referrer"') && es.includes('onerror='), 'P2 lazy + no-referrer + graceful degrade');
  ok(es.includes('translate.google.com/translate?sl=auto&amp;tl=en&amp;u=https%3A%2F%2Felpais.com%2Fx'), 'P2 READ IN ENGLISH routes through translator');
  ok(es.includes('READ IN ENGLISH') && es.includes('SPANISH'), 'P2 language named, translated read offered');
  const en = api.renderItem({ headline: 'H', take: 'T', lang: 'english',
    source_name: 'Reuters', source_url: 'https://reuters.com/x' }, 1);
  ok(!en.includes('READ IN ENGLISH') && !en.includes('keyvis'), 'P2 English item: untouched credit, no empty figure');
  const legacy = api.renderItem({ headline: 'H', take: 'T', source_name: 'Wire', source_url: 'https://w.com/x' }, 2);
  ok(!legacy.includes('READ IN ENGLISH'), 'P2 legacy items (no lang) degrade to the old credit');
  const xss = api.renderItem({ headline: 'H', take: 'T', lang: 'spanish',
    image_url: 'https://a.com/"onload="alert(1)', source_name: 'X', source_url: 'https://a.com/x' }, 0);
  ok(!xss.includes('"onload="') && xss.includes('&quot;onload='), 'P2 image_url attribute injection escaped');
}

/* ── P3: RPS streak protocol (extract the spine client, stub the world) ── */
{
  const r = read('arcade/rps/index.html');
  const a = r.indexOf("const ARCADE_API");
  const b = r.indexOf('function arcEsc');
  const client = r.slice(a, b);
  const calls = [];
  const env = {
    state: { you: 2, cpu: 3, cheat: false, endless: false, winStreak: 0, bestStreak: 0 },
    localStorage: { _p: null, getItem() { return this._p; }, setItem(k, v) { this._p = v; } },
    fetch: async (url, opts) => ({ json: async () => {
      calls.push({ url, body: opts && opts.body ? JSON.parse(opts.body) : null });
      if (url.includes('/session')) return { ok: true, token: 'tok' + calls.length };
      if (url.includes('/score'))   return { ok: true, rank: { rank: 1, score: 3 } };
      return { ok: true };
    }})
  };
  const api = new Function('state', 'localStorage', 'fetch',
    client + '; return { arcTrackRound, arcFlush, arcNewSession, arcSavePlayer, tok: () => arcToken, sub: () => arcSubmittedBest };')(
    env.state, env.localStorage, env.fetch);

  // streak semantics: W W T W L  -> best 3, tie held, loss broke
  ['win','win','tie','win'].forEach(o => api.arcTrackRound(o));
  ok(env.state.winStreak === 3 && env.state.bestStreak === 3, 'P3 tie holds the streak (W W T W = 3)');
  api.arcTrackRound('lose');
  ok(env.state.winStreak === 0 && env.state.bestStreak === 3, 'P3 loss breaks the run, best survives');

  await api.arcNewSession();
  await api.arcFlush();                                    // not joined yet
  ok(calls.filter(c => c.url.includes('/score')).length === 0 && api.tok() === 'tok1', 'P3 unjoined flush preserves the token');
  api.arcSavePlayer({ id: 'p1', handle: 'FRESCO' });
  await api.arcFlush();                                    // joined: submits best=3
  const sc = calls.filter(c => c.url.includes('/score'));
  ok(sc.length === 1 && sc[0].body.score === 3 && sc[0].body.game === 'rps' && sc[0].body.token === 'tok1', 'P3 join-then-flush submits best streak on the match token');
  ok(api.sub() === 3 && api.tok() === 'tok3', 'P3 highwater recorded, session re-armed');
  await api.arcFlush();                                    // nothing new to say
  ok(calls.filter(c => c.url.includes('/score')).length === 1, 'P3 highwater prevents duplicate submits');
  env.state.endless = true;
  api.arcTrackRound('win'); api.arcTrackRound('win'); api.arcTrackRound('win'); api.arcTrackRound('win');
  api.arcTrackRound('lose');                               // endless: banks 4
  await new Promise(res => setTimeout(res, 10));
  const sc2 = calls.filter(c => c.url.includes('/score'));
  ok(sc2.length === 2 && sc2[1].body.score === 4 && sc2[1].body.meta.format === 'endless', 'P3 endless banks a broken run');
}

console.log('\nPROOF: ' + pass + '/' + pass + ' assertions PASS');
