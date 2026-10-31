/**
 * proof_space_sets.mjs  --  NT1a THE SETS: SEAM:SPACES. A category the house holds is read through the set the house names for it;
 * the label's set stands when it names none. The seed makes each member a watched brand and an entity on the graph, uses what the
 * graph already holds as it is, and marks a member made here with context words ambiguous and relinks it on them. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

const blockSrc = between(w, '/* ═══ SEAM:SPACES (NT1 THE SPACES)', '/* ═══ SEAM:ENTITY_ROOM (RM1): the rooms on the graph.');
const LAW = new Function(between(w, 'const DOOR_LAW = ', 'function excDoorPrompt(') + '; return { DOOR_LAW, doorMoveSize };')();
const ENTITY = { MIN_NAME: 3, BACKFILL_WEEKS: 12 };
const calls = [];
let MAP = {};
const fakeSb = async (env, path, o) => {
  calls.push({ path, o: o || {} });
  if (path === 'tracks' && o && o.method === 'POST') return [{ id: 't-' + o.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: o.body.name, aliases: o.body.aliases, sector: o.body.sector }];
  return null;
};
const made = [];
const fakeResolve = async (env, name, opts) => { made.push({ name, opts }); return { id: 'e-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name }; };
const quiet = (label, fb) => () => fb;
const P = new Function('DOOR_LAW', 'DOOR', 'ENTITY', 'entityMap', 'entityResolveName', 'sbRest', 'excQuiet',
  blockSrc + '; return { SPACES, spaceCandOf, spaceSetSeed };')(LAW.DOOR_LAW, { WANT: 30 }, ENTITY, async () => MAP, fakeResolve, fakeSb, quiet);

// A: the category reads its named set
const ent = new Map([['e1', 'Ray-Ban Meta'], ['e2', 'Xreal'], ['e9', 'Labelled Co']]), n7 = new Map([['e1', 5], ['e2', 2]]);
const named = P.spaceCandOf({ key: 'cat:smart-glasses', kind: 'category', name: 'Smart glasses', category: 'smart glasses', frame: { members: [{ id: 'e1', name: 'Ray-Ban Meta' }, { id: 'e2', name: 'Xreal' }, { name: 'no id' }] } },
  { entName: ent, n7, sets: new Map([['smart glasses', [{ id: 'e9', name: 'Labelled Co', n7: 40 }]]]) });
ok(named && named.form === 'category' && named.names.join('|') === 'Ray-Ban Meta|Xreal' && named.entity_ids.join('|') === 'e1|e2' && named.velocity === 7 && named.lens === 'market',
  'A1 a category with a named set reads those members (a member with no id dropped), their week as its velocity, ahead of the label\'s set');
const label = P.spaceCandOf({ key: 'cat:smart-glasses', kind: 'category', name: 'Smart glasses', category: 'smart glasses', frame: {} }, { entName: ent, n7, sets: new Map([['smart glasses', [{ id: 'e9', name: 'Labelled Co', n7: 40 }]]]) });
const none = P.spaceCandOf({ key: 'cat:seasonings', kind: 'category', name: 'Seasonings', category: 'seasonings', frame: {} }, { entName: ent, n7, sets: new Map() });
ok(label && label.entity_ids.join() === 'e9' && label.velocity === 40 && none === null, 'A2 with no named set the label\'s set stands as NT1 built it; with neither, nothing is read');
const many = Array.from({ length: 11 }, (_, i) => ({ id: 'm' + i, name: 'Member ' + i }));
const capped = P.spaceCandOf({ key: 'cat:x', kind: 'category', name: 'X', category: 'x', frame: { members: many } }, { entName: new Map(), n7: new Map(), sets: new Map() });
ok(capped.entity_ids.length === P.SPACES.SET && P.SPACES.SET === 8, 'A3 a named set is read to SPACES.SET members (eight)');

// B: the seed
MAP = { xreal: { id: 'e-x', name: 'Xreal' }, 'ray-ban meta': { id: 'e-rbm', name: 'Ray-Ban Meta' } };
const tracks = [{ id: 't-even', name: 'Even Realities', aliases: ['Even G2'], sector: 'wearables' }];
const got = await P.spaceSetSeed({}, 'Smart Glasses', [
  { name: 'Xreal' },
  { name: 'Meta Ray-Ban', aliases: ['Ray-Ban Meta'] },
  { name: 'even g2' },
  { name: 'Snap Spectacles', aliases: ['Spectacles'], context: ['Snap', 'glasses', 'AR'] },
  'Rokid',
  { name: 'Rokid' },
  { name: 'ab' }
], tracks);
const posts = calls.filter(c => c.path === 'tracks' && c.o.method === 'POST');
ok(got.members.map(m => m.id).join('|') === 'e-x|e-rbm|e-even-realities|e-snap-spectacles|e-rokid' && got.skipped.map(s => s.why).join('|') === 'name|name',
  'B1 five members: two the graph already holds (by name, and by an alias) used as they are; a duplicate and a short name skipped');
ok(posts.length === 2 && posts.every(p => p.o.body.sector === 'smart glasses' && p.o.body.kind === 'brand' && p.o.body.active === true) && got.tracks_made === 2 && tracks.length === 3,
  'B2 a member the house neither tracks nor holds becomes a watched brand under the category (two tracks made; one found by its alias)');
ok(made.length === 3 && made.every(m => m.opts.create === true && m.opts.track) && made[0].name === 'Even Realities' && made[0].opts.track.id === 't-even' && made[0].opts.track.sector === 'wearables' && made[0].opts.track.aliases.join() === 'Even G2'
  && made.slice(1).every(m => m.opts.category === 'smart glasses' && m.opts.track.sector === 'smart glasses') && got.entities_made === 3,
  'B3 each new member becomes an entity from its track and is backfilled alone, as a watched brand is: a track the house already keeps names it in its own spelling and sector; a new one under the category');
const patch = calls.filter(c => /^entities\?id=eq\./.test(c.path) && c.o.method === 'PATCH'), del = calls.filter(c => /^signal_entities\?entity_id=eq\./.test(c.path) && c.o.method === 'DELETE'), relink = calls.filter(c => c.path === 'rpc/resolve_signal_entities');
ok(patch.length === 1 && patch[0].path === 'entities?id=eq.e-snap-spectacles' && patch[0].o.body.ambiguous === true && patch[0].o.body.context.join() === 'snap,glasses,ar' && del.length === 1 && relink.length === 1 && relink[0].o.body.p_entity === 'e-snap-spectacles' && got.relinked === 1,
  'B4 a member made here with context words is marked ambiguous on them and its twelve weeks relinked; an entity the graph already held is never changed');
const full = await P.spaceSetSeed({}, 'seasonings and spice blends', Array.from({ length: 10 }, (_, i) => 'Brand Number ' + i), []);
ok(full.members.length === 8 && full.skipped.filter(s => s.why === 'set_full').length === 2, 'B5 the set is eight at most; the rest are said, not made');

// C: the wiring and the house rules
ok(/kind: 'category', members: c && typeof c === 'object' && Array\.isArray\(c\.members\) \? c\.members : null/.test(w) && /const got = await spaceSetSeed\(env, r\.name, h\.members, tracks\);\n      r\.frame\.members = got\.members;/.test(w),
  'C1 the seed takes a category with its members and writes them on the space\'s frame (0061\'s upsert merges the frame\'s keys)');
ok(/const ctx = \{ trackBy: new Map\(tracks\.map\(t => \[t\.id, t\]\)\), stats, entName, sets, n7 \};/.test(w) && /for \(const r of \(list\.rooms \|\| \[\]\)\) if \(r && r\.id\) n7\.set\(r\.id,/.test(w), 'C2 the night knows a named member\'s week by its id');
const fn = between(w, 'async function spaceSetSeed(', 'async function spacesSeed(env, body) {');
ok(!/[—–]/.test(fn) && !/callClaude|claudeBatchSubmit|callModel|env\.AI\.run/.test(fn), 'C3 no dash in the set\'s seed, and no model asked');

// D: the name pattern's trailing period (the migration beside the cut)
const mig = fs.readdirSync('supabase/migrations').filter(f => /_entity_pattern_dot\.sql$/.test(f));
const msql = mig.length === 1 ? fs.readFileSync('supabase/migrations/' + mig[0], 'utf-8') : '';
ok(mig.length === 1 && /clean := regexp_replace\(clean, '\\\.\+\$', ''\);/.test(msql) && /create or replace function public\.entity_pattern\(p_names text\[\]\)/.test(msql)
  && /\(case when clean ~ '\^\[\[:alnum:\]\]' then '\\m' else '' end\) \|\| clean \|\| \(case when clean ~ '\[\[:alnum:\]\]\$' then '\\M' else '' end\)/.test(msql) && !/[\u2014\u2013]/.test(msql),
  'D1 one migration drops a name\'s trailing period before the pattern is built, so "Diaspora Co." keeps its end boundary; the Oct 29 boundaries stand');

console.log(`\nproof_space_sets: ${pass} checks PASS`);
