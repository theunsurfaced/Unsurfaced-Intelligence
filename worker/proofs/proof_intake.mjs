/**
 * proof_intake.mjs  --  EX37 THE INTAKE: SEAM:INTAKE. Every territory is fed (the registry's gate), every source and every lane is
 * read each slice, a multi-territory source places by its words, the drain is one neighbourhood call per row with the classify on
 * starters only, the free-plan sizing is gone, the desk and the watch see the intake.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const toml = fs.readFileSync('worker/wrangler.toml', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
// the registry, evaluated from its own text
const regSrc = between(w, '  sources: [\n', '  gdelt: { tier: 4,');
const reg = new Function('return ({' + regSrc + 'x: 1 })')();
const terrs = new Function('return ' + between(w, "  territories: [\n    'advertising-marketing'", '  // Legacy SLATE compatibility').replace(/^\s*territories: /, '').replace(/,\s*$/, '').replace(/\/\*[\s\S]*?\*\//g, ''))();
ok(terrs.length === 20 && reg.sources.length >= 60 && new Set(reg.sources.map(s => s.feed)).size === reg.sources.length && new Set(reg.sources.map(s => s.name)).size === reg.sources.length,
  'I1 the registry holds sixty or more sources, every feed and every name once, over the twenty territories');
const under = terrs.filter(t => { const s = reg.sources.filter(x => x.territories.includes(t)); return s.length < 3 || new Set(s.map(x => x.tier)).size < 2; });
ok(under.length === 0, 'I2 the gate: every territory has three or more sources across two or more tiers' + (under.length ? ' (under: ' + under.join(', ') + ')' : ''));
ok(reg.sources.every(s => s.territories.every(t => terrs.includes(t)) && [1, 2, 3].includes(s.tier) && /^https:\/\//.test(s.feed)), 'I3 every source names only configured territories, a tier of 1 to 3 and an https feed');
ok(terrs.every(t => Array.isArray(reg.lanes[t]) && reg.lanes[t].length >= 2), 'I4 a GDELT lane with two or more queries for every territory');
// the capture
const cap = between(w, 'async function spineCapture(env, opts) {', 'async function runDailySpine(env, opts) {');
ok(/const sources = nFeeds === 'all'\s*\? DAILY_POV\.sources\.filter\(s => probe \|\| !\(health\[s\.name\] && health\[s\.name\]\.fail >= INTAKE\.DEAD_AFTER\)\)/.test(cap) && /const lanes = nLanes === 'all'\s*\? Object\.keys\(DAILY_POV\.lanes/.test(cap), 'I5 every source and one lane per territory on every slice; a dead feed waits for the probe');
ok(/territory: intakeTerritory\(s, it\)/.test(cap) && /function intakeTerritory\(source, item\)/.test(w) && /territoryGuessIn\(String\(item\.title \|\| ''\) \+ ' ' \+ String\(item\.summary \|\| ''\), terrs\) \|\| terrs\[0\]/.test(w), 'I6 a multi-territory source places each story by its words within its own territories');
ok(/territory: lane\.territory \|\| null/.test(cap) && /INTAKE\.HEALTH_KEY, JSON\.stringify\(health\)/.test(cap) && /INTAKE\.YIELD_KEY \+ day, JSON\.stringify\(y\)/.test(cap), 'I7 a lane\'s rows carry its territory; the health and the day\'s yield are kept');
ok(/runDailySpine\(env, \{ feeds: 'all', gdelt: 'all', advance: INTAKE\.DRAIN \}\)/.test(w) && /runDailySpine\(env, \{ feeds: 'all', gdelt: 'all', advance: INTAKE\.DRAIN, probe: true \}\)/.test(w) && !/advance: 42/.test(w) && !/free cap 50/.test(w) && !/free-tier law/.test(w), 'I8 the crons read everything and drain INTAKE.DRAIN; the 05:15 run probes; the free-plan sizing is gone');
// the drain
const dr = between(w, 'async function spineAdvance(env, budget) {', 'async function runDailySpine(env, opts) {');
ok((dr.match(/'rpc\/match_signals'/g) || []).length === 1 && /const echo = near\.find\(n => n\.similarity >= SPINE\.ECHO_SIM\);/.test(dr) && /const anchor = near\.find\(n => n\.similarity >= SPINE\.CLUSTER_SIM && n\.status !== 'rejected'\);/.test(dr), 'I9 one neighbourhood call per row: the echo and the anchor read from the same sample');
ok(/const starters = placed\.filter\(x => !\(x\.anchor && clusterOf\[x\.anchor\.id\]\)\);/.test(dr) && /DAILY_POV\.stages\.filter_batch/.test(dr) && /i \+= INTAKE\.CLASSIFY_BATCH/.test(dr) && /const list = parseJsonList\(reply\);/.test(dr) && (dr.match(/callModel\(/g) || []).length === 1, 'I10 only rows that start a cluster are classified, CLASSIFY_BATCH to a call');
ok(/territory = terrOf\[anchor\.id\] \|\| r\.territory; novelty = Math\.max\(0, Math\.min\(5, Number\(anchor\.momentum && anchor\.momentum\.novelty\) \|\| 2\)\)/.test(dr), 'I11 a joiner inherits its cluster\'s territory and its anchor\'s novelty');
ok(/momentumMech\(near\.filter\(n => n\.research !== true\), territory, r\.source_tier, novelty\)/.test(dr) && /if \(!judged\.has\(r\.id\)\) novelty = 2;/.test(dr), 'I12 momentum counts the sweep only; an unjudged starter is neutral, never rejected');
ok(/limit=' \+ INTAKE\.EMBED \+ '/.test(dr) && /limit=' \+ INTAKE\.PLACE \+ '/.test(dr) && /const INTAKE = \{ DRAIN: 400, EMBED: 256, PLACE: 120, CLASSIFY_BATCH: 10, DEAD_AFTER: 3/.test(w), 'I13 the stages are sized to the plan');
ok(/\[limits\]\s*\ncpu_ms = 300000/.test(toml), 'I14 wrangler.toml raises the CPU ceiling to five minutes for the slice');
ok(/replace\(\/\^\(amp\|m\|www\)\\\.\/, ''\)/.test(w) && /replace\(\/\\\/amp\$\/, ''\)/.test(w), 'I15 an AMP or mobile host folds into the hash');
// the desk and the watch
ok(/which === 'intake' \? await intakeDesk\(env\)/.test(w) && /async function intakeDesk\(env\)/.test(w) && /function intakeGate\(\)/.test(w), 'I16 the desk\'s {run:"intake"}: the gate, the dead, the yield');
const wh = between(w, 'async function watchHealth(env) {', 'async function watchTick(env) {');
ok(/kind: 'intake_dead'/.test(wh) && /kind: 'intake_quiet'/.test(wh) && /out\.intake = \{/.test(wh), 'I17 the watch trips on dead feeds and on a territory quiet for three days');
console.log('proof_intake: ' + pass + ' ok');
