/**
 * proof_read_page.mjs  --  arc 4: receipts on /reads/get and the read page's laws.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const a = w.indexOf('async function readReceipts('), b = w.indexOf('async function readRoute(');
ok(a > 0 && b > a, 'P0 readReceipts ships inside the read engine');
let calls = [];
const sbRest = async (env, path) => { calls.push(path);
  return [{ id: 11, headline: 'Tour sells out', source_name: 'Billboard', source_url: 'https://b', editions: { date: '2026-09-14', issue_no: 70 } },
          { id: 12, headline: 'Merch drop', source_name: 'Pitchfork', source_url: 'https://p', editions: { date: '2026-09-15', issue_no: 71 } }]; };
const readReceipts = new Function('sbRest', w.slice(a, b) + '; return readReceipts;')(sbRest);
const rc = await readReceipts({}, { patterns: [{ evidence: ['S11', 'S12', 'junk'], moves: { creative: 'S99 in prose is not a citation' } }],
  social: { frames: [{ evidence: ['S12'] }] }, cross_currents: [{ evidence: ['S11'] }] });
ok(calls.length === 1 && /id=in\.\(11,12\)/.test(calls[0]), 'P1 only evidence arrays are cited, deduped, one query');
ok(rc.S11.headline === 'Tour sells out' && rc.S11.issue_no === 70 && rc.S12.date === '2026-09-15', 'P2 receipts carry headline, source, date, issue');
ok(/receipts: await readReceipts\(env, row\.read\)/.test(w), 'P3 /reads/get returns receipts');

ok(/SEAM:READ_PAGE/.test(page), 'G1 page carries its seam');
ok(!/service_role/.test(page), 'G2 no service key on the page');
const intel = fs.readFileSync('intelligence/index.html', 'utf-8');
const key = (intel.match(/const SUPABASE_ANON_KEY\s*=\s*'([^']+)'/) || [])[1];
ok(key && page.includes(key), 'G3 page uses the live anon key from the intelligence page');
ok(/connect-src 'self' https:\/\/\*\.supabase\.co https:\/\/api\.unsurfaced-intelligence\.com/.test(page), 'G4 CSP allows only Supabase and the API');
const daily = fs.readFileSync('daily/index.html', 'utf-8');
const mk = (daily.match(/<svg class="fp-mark" viewBox="162\.68 272\.12 445\.04 42\.80" aria-hidden="true">([\s\S]*?)<\/svg>/) || [])[1];
const pm = page.match(/var MARK = ("(?:[^"\\]|\\.)*");/);
ok(mk && pm && JSON.parse(pm[1].replace(/<\\\//g, '</')) === mk, 'G5 the DAILY mark is the real mark, inlined');
ok(/table class="flow"><thead>/.test(page), 'G10 interior pages repeat their print margins');
ok(!/—/.test(page.replace(/<style>[\s\S]*?<\/style>/, '')), 'G6 no em dash in the page copy');
ok(/The read is free\.<br>The moves are yours\./.test(page), 'G7 the house closer');
ok(/@page \{ size: letter; margin: 0; \}/.test(page) && /print-color-adjust: exact/.test(page), 'G8 letter pages, backgrounds kept in the PDF');
ok(/\/reads\/publish/.test(page) && /\/reads\/reland/.test(page), 'G9 publish and re-land wired');
console.log(`\nproof_read_page: ${pass} checks PASS`);
