/**
 * proof_slots.mjs  --  ED1 THE SLOTS: rights records, the make service, the lake's look, the slot doors, the thumbnails.
 * Run from the repo root: node worker/proofs/proof_slots.mjs
 *   R rights   M make   L look   S slots   W wiring   P page   G migration
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0051_media_rights.sql', 'utf-8');
const briefMd = fs.readFileSync('templates/IMAGE_BRIEF.md', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = w.indexOf(b, i); if (j < 0) throw new Error('anchor missing: ' + b); return w.slice(i, j); };
const block = between('/* SEAM:MEDIA_RIGHTS (ED1)', '/* SEAM:READ_DESIGN image relay');
const hex = between('function readHex(', '\n') + '\n';
const briefLine = between('const IMAGE_BRIEF = ', '\n') + '\n';
const revLine = between('const IMAGE_BRIEF_REV = ', '\n') + '\n';

// ── fakes ─────────────────────────────────────────────────────────────
let sb = [], fixtures = {}, events = [], kv = new Map(), r2 = new Map(), fetches = [], aiAnswers = [], claudeAnswer = null;
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const env = {
  FAL_KEY: 'k', SUPABASE_URL: 'https://x', MAKE_HOUSE_CAP_USD: '0.05',
  MEDIA: { head: async k => r2.has(k) ? { key: k } : null, get: async k => r2.has(k) ? { arrayBuffer: async () => r2.get(k) } : null, put: async (k, b) => { r2.set(k, b); } },
  RATE_LIMIT: { get: async k => kv.has(k) ? kv.get(k) : null, put: async (k, v) => { kv.set(k, v); }, delete: async k => { kv.delete(k); } },
  AI: { run: async (model, input) => { const a = aiAnswers.shift(); if (model.includes('bge')) return { data: a || [] }; return { response: a == null ? '' : a }; } }
};
const jpeg = () => { const b = new Uint8Array(13000); b[0] = 0xFF; b[1] = 0xD8; b[2] = 0xFF; return b.buffer; };
let falFail = null;
const fetch = async (url, opts) => {
  fetches.push({ url, opts });
  if (url === 'https://queue.fal.run/st/1') return { ok: true, json: async () => ({ status: falFail === 'failed' ? 'FAILED' : 'COMPLETED' }) };
  if (url === 'https://queue.fal.run/rs/1') return { ok: true, json: async () => ({ images: [{ url: 'https://fal.media/out.jpg', width: 896, height: 1152 }], has_nsfw_concepts: [false] }) };
  if (url.startsWith('https://queue.fal.run/')) {
    if (falFail === 'submit') return { ok: false, status: 503, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ status_url: 'https://queue.fal.run/st/1', response_url: 'https://queue.fal.run/rs/1' }) };
  }
  if (url === 'https://fal.media/out.jpg') return { ok: true, arrayBuffer: async () => jpeg() };
  return { ok: false, status: 404, json: async () => ({}) };
};
let rows = {}, rightsRows = [], patches = [];
fixtures['media_rights?id=eq.'] = (p, o) => { const id = p.split('id=eq.')[1].split('&')[0]; const r = rightsRows.find(x => x.id === id); if (o && o.method === 'PATCH') { Object.assign(r, o.body); return []; } return r ? [r] : []; };
fixtures['media_rights?ref=eq.'] = p => { const ref = decodeURIComponent(p.split('ref=eq.')[1].split('&')[0]); const r = rightsRows.filter(x => x.ref === ref); return r.length ? [r[r.length - 1]] : []; };
fixtures['media_rights'] = (p, o) => { const r = Object.assign({ id: '0000' + String(rightsRows.length + 1).padStart(4, '0') + '-0000-4000-8000-000000000000', created_at: new Date().toISOString() }, o.body[0]); rightsRows.push(r); return [r]; };
fixtures['house_reads?id=eq.7'] = (p, o) => { if (o && o.method === 'PATCH') { patches.push(o.body); Object.assign(rows[7], o.body); return []; } return [rows[7]]; };
fixtures['edition_items?id=eq.11'] = () => [{ id: 11, image_url: 'https://cdn.example.com/a.jpg', source_url: 'https://example.com/a', source_name: 'Wired' }];
fixtures['edition_items?id=eq.12'] = () => [{ id: 12, image_url: null, source_url: null, source_name: 'Nobody' }];
let describeRows = [];
fixtures['edition_items?id=in.(11'] = p => /image_desc=is\.null/.test(p) ? describeRows : /image_desc=not\.is\.null/.test(p) ? [{ id: 11, image_desc: 'warm sodium light on a wet platform, one figure, red umbrella' }] : [];   // the describer's rows; the likeness check and the brief's lake lines
const readRow = async (e, id) => rows[id] ? JSON.parse(JSON.stringify(rows[id])) : null;
const readPatch = async (e, id, patch) => { patches.push(patch); Object.assign(rows[id], patch); };
const json = (o, s) => Object.assign({ _status: s }, o);
const logEvent = (e, p, s, ev, sid, meta) => events.push({ ev, meta });
const callClaude = async () => claudeAnswer;
const embedQuery = async () => [1, 0, 0];
const excQuiet = (where, v) => e => v;
const sleep = async () => {};
const readImgUrl = raw => /^https:\/\//.test(String(raw || '')) ? String(raw) : null;
const readImgFetch = async href => ({ ok: true, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => jpeg() });
const R = new Function('sbRest', 'readRow', 'readPatch', 'json', 'logEvent', 'callClaude', 'embedQuery', 'KB_EMBED_MODEL', 'excQuiet', 'sleep', 'readImgUrl', 'readImgFetch', 'fetch', 'console',
  hex + briefLine + revLine + block + '; return { RIGHTS, MAKE, LAKE_LOOK, rightsContexts, rightsClears, readSlots, wkCoverCreditOf, makePrompt, briefReady, makeSize, makeImage, makeSpend, imageCheckParse, storyTellParse, storyTellOrder, storyTell, imageDescribePass, slotTarget, slotMain, slotLeads, slotBriefClean, slotRoute, IMAGE_BRIEF };')(
  sbRest, readRow, readPatch, json, logEvent, callClaude, embedQuery, '@cf/baai/bge-small-en-v1.5', excQuiet, sleep, readImgUrl, readImgFetch, fetch, { log: () => {} });

// ── R: rights ─────────────────────────────────────────────────────────
ok(R.rightsContexts('house', null).length === 8 && R.rightsContexts('house', { hard: ['logo'] }).length === 0 && R.rightsContexts('house', { hard: ['logo'], override: { why: 'an invented mark' } }).length === 8,
  'R1 a house image clears every context; a hard check clears nothing; an override on the record clears it again');
ok(!R.rightsContexts('story_obj', null).includes('stand_cover') && !R.rightsContexts('story_obj', null).includes('recon') && !R.rightsContexts('story_obj', null).includes('social') && R.rightsContexts('story_obj', null).includes('weekly_pdf') && !R.rightsContexts('press', null).includes('stand_cover'),
  'R2 a story photograph as the object of the finding never covers a paid product or goes to paid social; a press image never covers a paid product');
ok(R.rightsClears({ contexts: ['web'] }, 'web') && !R.rightsClears({ contexts: ['web'] }, 'recon') && !R.rightsClears(null, 'web'), 'R3 rightsClears reads the contexts column');
ok(R.wkCoverCreditOf({ meta: { slots: { cover: { kind: 'house', credit: 'Unsurfaced, AI illustration' } } } }, 'Wired') === 'Unsurfaced, AI illustration' && R.wkCoverCreditOf({ meta: { slots: { cover: { kind: 'type' } } } }, 'Wired') === 'Unsurfaced' && R.wkCoverCreditOf({ meta: {} }, 'Wired') === 'Wired' && R.wkCoverCreditOf({}, null) === null,
  'R4 the stand\'s cover credit follows the cover slot, else the story\'s');
ok(R.IMAGE_BRIEF === briefMd && /HARD/.test(R.IMAGE_BRIEF) && (R.IMAGE_BRIEF.match(/\(HARD\)/g) || []).length === 2, 'R5 the brief in the worker is the brief in the repo, with exactly two hard lines');

// ── M: the make service ───────────────────────────────────────────────
const brief = { scene: 'A woman in her sixties on a station platform at dawn, coat buttoned wrong, reading a paper ticket she has already folded twice.', light: 'sodium platform light', red: 'the ticket', story: 'she is paying for silence' };
const prompt = R.makePrompt(brief);
ok(prompt.includes(brief.scene) && prompt.includes('sodium platform light') && prompt.includes('deep signal red: the ticket') && !/\{scene\}|\{light\}|\{red\}/.test(prompt) && prompt.startsWith('Editorial photograph'),
  'M1 the prompt is the template paragraph with the scene, the light and the red filled');
ok(R.briefReady(brief) && !R.briefReady({ scene: brief.scene }) && !R.briefReady({ scene: 'short', story: 'a story sentence here' }), 'M2 no story sentence, no brief: nothing is made');
ok(R.makeSize('cover', false).width === 896 && R.makeSize('cover', true).width === 1792 && R.makeSize('hero', false).height === 768 && R.makeSize('bogus', false).width === 896, 'M3 a final is drawn at twice the draft\'s pixels');
const m1 = await R.makeImage(env, { brief, format: 'cover', seed: 101, by: 'u1' });
ok(m1.ok && /^make\/[0-9a-f]{40}\.jpg$/.test(m1.ref) && m1.model === 'fal-ai/z-image/turbo' && Math.abs(m1.usd - 0.0052) < 1e-9 && r2.has(m1.ref) && m1.rec.kind === 'house' && m1.rec.basis === 'AIR' && m1.rec.credit === 'Unsurfaced, AI illustration' && m1.rec.made.seed === 101 && m1.rec.made.prompt_version === 'house-v2' && m1.rec.contexts.length === 8,
  'M4 a draft lands in R2 under its hash with a rights record: house, AIR, credited, the brief and the seed on it');
const submit = fetches.find(f => f.url === 'https://queue.fal.run/fal-ai/z-image/turbo');
const sent = JSON.parse(submit.opts.body);
ok(submit.opts.headers.Authorization === 'Key k' && sent.image_size.width === 896 && sent.image_size.height === 1152 && sent.seed === 101 && sent.num_images === 1 && sent.output_format === 'jpeg' && sent.prompt === prompt, 'M5 fal receives the prompt, the size, the seed and one image');
ok(Math.abs(parseFloat(kv.get('make:house:' + new Date().toISOString().slice(0, 7))) - 0.0052) < 1e-9 && events.some(e => e.ev === 'make_image'), 'M6 the house\'s month carries the spend and the event is logged');
const n0 = fetches.length;
const m2 = await R.makeImage(env, { brief, format: 'cover', seed: 101, by: 'u1' });
ok(m2.ok && m2.cached && m2.usd === 0 && m2.rights_id === m1.rights_id && fetches.length === n0, 'M7 the same brief, seed and size is served from R2: nothing is fetched, nothing is paid');
kv.set('make:house:' + new Date().toISOString().slice(0, 7), '0.049');
const m3 = await R.makeImage(env, { brief, format: 'cover', seed: 202, by: 'u1' });
ok(!m3.ok && m3.error === 'house_cap' && m3.fallback === 'type' && m3.cap === 0.05, 'M8 past the house cap the make is refused with the typographic fallback, and nothing is fetched');
kv.set('make:house:' + new Date().toISOString().slice(0, 7), '0');
falFail = 'failed';
const m4 = await R.makeImage(env, { brief, format: 'cover', seed: 303, by: 'u1' });
ok(!m4.ok && m4.error === 'fal_failed' && m4.fallback === 'type' && Math.abs(parseFloat(kv.get('make:house:' + new Date().toISOString().slice(0, 7)))) < 1e-9, 'M9 a failed render refunds the house and falls back to type');
falFail = null;
ok(!(await R.makeImage({}, { brief })).ok && (await R.makeImage({}, { brief })).error === 'render_unconfigured' && (await R.makeImage(env, { brief: { scene: 'x' } })).error === 'brief_not_ready', 'M10 no key or no brief: refused before any spend');
const m5 = await R.makeImage(env, { brief, format: 'cover', seed: 101, refine_from: m1.ref, by: 'u1' });
const fin = JSON.parse(fetches.filter(f => f.url === 'https://queue.fal.run/fal-ai/bytedance/seedream/v4/edit').pop().opts.body);
ok(m5.ok && m5.model === 'fal-ai/bytedance/seedream/v4/edit' && fin.image_urls[0] === 'https://api.unsurfaced-intelligence.com/media/' + m1.ref && fin.image_size.width === 1792 && m5.rec.made.refine_from === m1.ref && Math.abs(m5.usd - 0.03) < 1e-9,
  'M11 the final refines the picked draft on the premium model at print size, the draft as its reference');

// ── L: the lake\'s look ────────────────────────────────────────────────
const c1 = R.imageCheckParse('REAL_PERSON: no\nLOGO: yes\nTEXT: no\nHANDS_FACES: yes\nRED: yes\nROOM: no\nSHOWS: a woman on a platform with a red ticket.');
ok(c1.hard.join() === 'logo' && c1.advisory.join() === 'hands_faces,little_room' && c1.unknown.length === 0 && c1.shows === 'a woman on a platform with a red ticket.', 'L1 the checks parse: two hard lines, the rest advisory, the one sentence kept');
const c2 = R.imageCheckParse('I cannot tell. SHOWS: a street.');
ok(c2.hard.length === 0 && c2.advisory.length === 0 && c2.unknown.length === 6 && c2.shows === 'a street.', 'L2 what the model did not answer is unknown, never hard');
ok(R.storyTellParse('MATCH: 2 CONFIDENCE: 0.8 SHOWS: a leash.', 3).pick === 2 && R.storyTellParse('MATCH: 9', 3).pick === 0 && R.storyTellParse('MATCH: 0 CONFIDENCE: 1.4', 3).confidence === 1 && R.storyTellOrder(['a', 'b', 'c', 'd'], 5).join() === R.storyTellOrder(['a', 'b', 'c', 'd'], 5).join() && R.storyTellOrder(['a', 'b', 'c', 'd'], 5).slice().sort().join() === 'a,b,c,d',
  'L3 the story test parses and shuffles the same way every time');
aiAnswers = ['MATCH: 1 CONFIDENCE: 0.9 SHOWS: a ticket.'];
const leads = ['People pay for silence', 'Makers brake their machines', 'Buyers buy the nineties'];
const order = R.storyTellOrder(leads, m1.ref.length);
const t1 = await R.storyTell(env, m1.ref, leads, order[0]);
ok(t1.correct === true && t1.matched === order[0] && t1.confidence === 0.9, 'L4 the image alone against the shuffled headlines: told its own story');
rows[7] = { id: 7, kind: 'weekly', status: 'published', pack_ids: [11, 12], meta: {}, read: { title: 'People pay for silence', thesis: 'The audience now bills for quiet.', patterns: [{ name: 'Makers brake their machines', dek: 'A brake is a feature.', evidence: ['S11', 'S12'] }, { name: 'Buyers buy the nineties', evidence: ['S12'] }] } };
fixtures['house_reads?select=pack_ids'] = () => [{ pack_ids: [11, 12] }];
let described = [];
describeRows = [{ id: 11, image_url: 'https://cdn.example.com/a.jpg' }, { id: 12, image_url: 'notaurl' }];
fixtures['edition_items?id=eq.11'] = (p, o) => { if (o && o.method === 'PATCH') { described.push([11, o.body.image_desc]); return []; } return [{ id: 11, image_url: 'https://cdn.example.com/a.jpg', source_url: 'https://example.com/a', source_name: 'Wired' }]; };
fixtures['edition_items?id=eq.12'] = (p, o) => { if (o && o.method === 'PATCH') { described.push([12, o.body.image_desc]); return []; } return [{ id: 12, image_url: null, source_url: null, source_name: 'Nobody' }]; };
aiAnswers = ['Warm sodium light on a wet platform, one figure, a red umbrella, calm lower third.'];
const d1 = await R.imageDescribePass(env, {});
ok(d1.ok && d1.described === 1 && d1.looked === 1 && described.length === 2 && described[0][1].startsWith('Warm sodium') && described[1][1] === '' && kv.get('look:day:' + new Date().toISOString().slice(0, 10)) === '1',
  'L5 the describer writes one sentence per photograph, marks the unfetchable so it is not asked again, and counts the day');
kv.set('look:day:' + new Date().toISOString().slice(0, 10), String(R.LAKE_LOOK.PER_DAY));
ok((await R.imageDescribePass(env, {})).day_cap === true, 'L6 at the day\'s cap the describer looks at nothing');
kv.delete('look:day:' + new Date().toISOString().slice(0, 10));

// ── S: the slot doors ─────────────────────────────────────────────────
ok(R.slotTarget(rows[7].read, 'cover').title === 'People pay for silence' && R.slotTarget(rows[7].read, 'patterns[1]').title === 'Buyers buy the nineties' && R.slotTarget(rows[7].read, 'patterns[5]') === null && R.slotMain(rows[7].read).key === 'patterns' && R.slotLeads(rows[7].read).length === 3,
  'S1 a slot path points at its finding; the leads are the title and the findings');
const s0 = await R.slotRoute('/reads/slots', { id: 7 }, env, '', { id: 'u1' });
ok(s0.ok && s0.paths.join() === 'cover,patterns[0],patterns[1]' && s0.house.cap_usd === 0.05 && s0.make.draft === 'fal-ai/z-image/turbo' && s0.make.configured === true, 'S2 /reads/slots lists the cover and one slot per finding, with the house\'s month and the models');
ok((await R.slotRoute('/reads/slot', { id: 7, path: 'cover; drop', pick: { type: true } }, env, '', { id: 'u1' })).error === 'bad_path' && (await R.slotRoute('/reads/slot', { id: 7, path: 'patterns[7]', pick: { type: true } }, env, '', { id: 'u1' })).error === 'no_such_slot' && (await R.slotRoute('/reads/slot', { id: 9, path: 'cover', pick: { type: true } }, env, '', { id: 'u1' })).error === 'not_found',
  'S3 a bad path, a slot the read does not have, a read that is not there: refused');
const s1 = await R.slotRoute('/reads/slot', { id: 7, path: 'cover', pick: { type: true } }, env, '', { id: 'u1' });
ok(s1.ok && s1.slot.kind === 'type' && rows[7].meta.slots.cover.kind === 'type' && rows[7].meta.slots.cover.by === 'u1' && rightsRows.find(r => r.id === s1.slot.rights_id).basis === 'A' && events.some(e => e.ev === 'slot_pick'),
  'S4 the typographic block is a slot with a rights record of its own (basis A), written on the read');
ok((await R.slotRoute('/reads/slot', { id: 7, path: 'patterns[0]', pick: { story: 'S11' } }, env, '', { id: 'u1' })).error === 'object_sentence_required' && (await R.slotRoute('/reads/slot', { id: 7, path: 'patterns[0]', pick: { story: 'S99', object_sentence: 'a sentence long enough to count' } }, env, '', { id: 'u1' })).error === 'not_in_the_read' && (await R.slotRoute('/reads/slot', { id: 7, path: 'patterns[0]', pick: { story: 'S12', object_sentence: 'a sentence long enough to count' } }, env, '', { id: 'u1' })).error === 'no_photograph',
  'S5 a story photograph needs the sentence that makes it the object of the finding, and the story must be in the read with a photograph');
const s2 = await R.slotRoute('/reads/slot', { id: 7, path: 'patterns[0]', pick: { story: 'S11', object_sentence: 'The brake lever itself, photographed by Wired, is the finding.' } }, env, '', { id: 'u1' });
const s2rec = rightsRows.find(r => r.id === s2.slot.rights_id);
ok(s2.ok && s2.slot.kind === 'story_obj' && s2.slot.ref === 'S11' && s2.slot.credit === 'Photo: Wired' && s2rec.basis === 'OBJ' && s2rec.object_sentence.startsWith('The brake lever') && s2rec.display_max_px === 900 && s2rec.contexts.includes('weekly_pdf') && !s2rec.contexts.includes('recon'),
  'S6 a story photograph as the object of the finding: OBJ, credited to the outlet, the sentence on the record, never a paid cover');
const flagged = rightsRows.find(r => r.id === m1.rights_id);
flagged.made.checks = { hard: ['real_person'], advisory: [] }; flagged.contexts = [];
const s3 = await R.slotRoute('/reads/slot', { id: 7, path: 'cover', pick: { rights_id: m1.rights_id } }, env, '', { id: 'u1' });
ok(!s3.ok && s3.error === 'not_cleared' && s3.hard.join() === 'real_person' && rows[7].meta.slots.cover.kind === 'type', 'S7 a record that failed a hard check is refused; the slot stays as it was');
const s4 = await R.slotRoute('/reads/slot', { id: 7, path: 'cover', pick: { rights_id: m1.rights_id }, override: 'an invented woman, not a likeness of anyone', accepted: ['no_red'] }, env, '', { id: 'u1' });
ok(s4.ok && s4.slot.kind === 'house' && s4.slot.credit === 'Unsurfaced, AI illustration' && s4.slot.accepted.join() === 'no_red' && flagged.made.checks.override.why.startsWith('an invented') && flagged.made.checks.override.by === 'u1' && flagged.contexts.length === 8 && rows[7].meta.slots.cover.ref === m1.ref,
  'S8 the admin overrides with a reason: the judgment is written on the record, the record clears, the slot is set with the accepted notes');
ok((await R.slotRoute('/reads/slot', { id: 7, path: 'cover', pick: { rights_id: m1.rights_id }, override: 'short' }, env, '', { id: 'u1' })).ok === true, 'S9 a cleared record stays cleared');
ok((await R.slotRoute('/reads/slot', { id: 7, path: 'cover', pick: {} }, env, '', { id: 'u1' })).error === 'bad_pick' && (await R.slotRoute('/reads/slot', { id: 7, path: 'cover', pick: { rights_id: 'not-a-uuid' } }, env, '', { id: 'u1' })).error === 'no_such_record', 'S10 an empty pick or an unknown record is refused');
const s5 = await R.slotRoute('/reads/slot', { id: 7, path: 'cover', pick: { clear: true } }, env, '', { id: 'u1' });
ok(s5.ok && s5.slot === null && !rows[7].meta.slots.cover && rows[7].meta.slots['patterns[0]'], 'S11 clearing a slot gives the writer\'s pick back and leaves the other slots');
ok((await R.slotRoute('/reads/slot-make', { id: 7, path: 'cover' }, env, '', { id: 'u1' })).error === 'brief_not_ready', 'S12 drafts need a brief: with none on the read, the door says so');
claudeAnswer = { ok: true, text: 'Here: {"scene": "A man in his seventies in a hardware store aisle at closing time, holding a bicycle brake lever up to the light, reading glasses pushed into grey hair, the shelf behind him half empty.", "light": "fluorescent closing-time light", "red": "the brake cable end", "story": "a maker is slowing his own machine on purpose"}' };
const b1 = await R.slotRoute('/reads/slot-brief', { id: 7, path: 'patterns[0]' }, env, '', { id: 'u1' });
ok(b1.ok && b1.brief.story.startsWith('a maker') && rows[7].meta.briefs['patterns[0]'].written === 'house' && rows[7].meta.briefs['patterns[0]'].red === 'the brake cable end', 'S13 the house writes a brief from the finding, kept on the read as the house\'s');
claudeAnswer = { ok: true, text: 'no json here' };
ok((await R.slotRoute('/reads/slot-brief', { id: 7, path: 'cover' }, env, '', { id: 'u1' })).error === 'brief_not_written', 'S14 a brief that is not JSON is not a brief');
r2.clear(); fetches = []; events = []; kv.set('make:house:' + new Date().toISOString().slice(0, 7), '0');
aiAnswers = [
  'REAL_PERSON: no LOGO: no TEXT: no HANDS_FACES: no RED: yes ROOM: yes SHOWS: a man holds a brake lever to the light.', 'MATCH: 0 CONFIDENCE: 0.2 SHOWS: a lever.', [[1, 0, 0]],
  'REAL_PERSON: yes LOGO: no TEXT: no HANDS_FACES: no RED: yes ROOM: yes SHOWS: a famous actor holds a lever.', 'MATCH: 1 CONFIDENCE: 0.9 SHOWS: a lever.', [[0, 1, 0]]
];
const mk = await R.slotRoute('/reads/slot-make', { id: 7, path: 'patterns[0]', n: 2, seed: 500, note: 'the first set read as a toy; make the lever real' }, env, '', { id: 'u1' });
ok(mk.ok && mk.drafts.length === 2 && mk.drafts.every(d => d.ok) && mk.drafts[0].seed === 500 && mk.drafts[1].seed === 601 && mk.leads.length === 3 && Math.abs(mk.house.used_usd - 0.0104) < 1e-9,
  'S15 /reads/slot-make makes the drafts from the kept brief, each with its own seed, and the house pays once for the set');
const drafts = mk.drafts, flaggedDraft = drafts.find(d => d.flagged), cleanDraft = drafts.find(d => !d.flagged);
ok(cleanDraft && flaggedDraft && flaggedDraft.checks.hard.join() === 'real_person' && rightsRows.find(r => r.id === flaggedDraft.rights_id).contexts.length === 0 && rightsRows.find(r => r.id === cleanDraft.rights_id).contexts.length === 8 && rightsRows.find(r => r.id === cleanDraft.rights_id).made.checks.shows.startsWith('a man holds'),
  'S16 every draft is checked and the verdict is on its record: a hard flag clears nothing, a clean draft clears everything');
ok(cleanDraft.checks.advisory.some(a => a.startsWith('like_press:S11')) && (cleanDraft.tell.correct === false || cleanDraft.tell.matched === null), 'S17 a draft too like a story photograph is noted (advisory), and the story test says whether it told its own');
ok(rows[7].meta.briefs['patterns[0]'].note.startsWith('the first set') && events.some(e => e.ev === 'slot_make' && e.meta.n === 2), 'S18 the remake note rides on the kept brief and the make is logged');
kv.set('make:house:' + new Date().toISOString().slice(0, 7), '0.049');
ok((await R.slotRoute('/reads/slot-make', { id: 7, path: 'patterns[0]', n: 4 }, env, '', { id: 'u1' })).error === 'house_cap', 'S19 four drafts past the cap: refused before anything is made');
kv.set('make:house:' + new Date().toISOString().slice(0, 7), '0');
ok((await R.slotRoute('/reads/slot-final', { id: 7, path: 'patterns[0]', rights_id: flaggedDraft.rights_id }, env, '', { id: 'u1' })).error === 'draft_failed_a_hard_check', 'S20 a flagged draft is not refined');
aiAnswers = ['REAL_PERSON: no LOGO: no TEXT: no HANDS_FACES: no RED: yes ROOM: yes SHOWS: the lever, larger.'];
const fn = await R.slotRoute('/reads/slot-final', { id: 7, path: 'patterns[0]', rights_id: cleanDraft.rights_id }, env, '', { id: 'u1' });
ok(fn.ok && fn.model === 'fal-ai/bytedance/seedream/v4/edit' && fn.rights_id !== cleanDraft.rights_id && rightsRows.find(r => r.id === fn.rights_id).made.final_of === cleanDraft.rights_id && !fn.flagged && Math.abs(fn.usd - 0.03) < 1e-9,
  'S21 the final is its own record, pointing back at the draft it refined');
const set = await R.slotRoute('/reads/slot', { id: 7, path: 'patterns[0]', pick: { rights_id: fn.rights_id } }, env, '', { id: 'u1' });
ok(set.ok && set.slot.kind === 'house' && rows[7].meta.slots['patterns[0]'].ref === fn.ref && rows[7].read.patterns[0].evidence.join() === 'S11,S12', 'S22 the final fills the slot; the read\'s text and evidence are untouched');

// ── W: wiring ─────────────────────────────────────────────────────────
const dispatch = w.slice(w.indexOf('async fetch('), w.indexOf('// Everything below requires a signed-in user'));
ok(/path\.startsWith\('\/img\/t\/'\)\) return readImageRelay\(path, env\)/.test(dispatch), 'W1 /img/t/<id> rides the same relay');
const relay = between('async function readImageRelay(', '/* SEAM:READ_PRINT');
ok(relay.includes("/^\\/img\\/([st])\\/(\\d{1,9})$/.exec(path)") && relay.includes("/v2/' + (thumb ? 't' : 's') + '/' + id") && relay.includes('thumb ? READ_IMG.THUMB : null') && relay.includes("'X-Img-Size': sized") && /THUMB: \{ image: \{ width: 400, fit: 'scale-down'/.test(w),
  'W2 the relay reads the kind from the path, caches thumbnails apart, asks the zone to resize to 400 px and says what it served');
ok(/async function readImgFetch\(href, accept, cf\)/.test(w) && /cf \? \{ cf \} : \{\}\)\)/.test(w), 'W3 readImgFetch carries the resize instruction');
const sw = w.slice(w.indexOf("case '/reads/compile':"), w.indexOf("case '/pay/onboard':"));
ok(["/reads/slots", "/reads/slot", "/reads/slot-brief", "/reads/slot-make", "/reads/slot-final"].every(p => sw.includes("case '" + p + "':")) && /if \(\/\^\\\/reads\\\/slots\?\(\?:-brief\|-make\|-final\)\?\$\/\.test\(path\)\) return slotRoute\(path, body, env, origin, user\);/.test(w),
  'W4 the five doors are routed through readRoute (admin at the door) to slotRoute');
ok(w.indexOf("if (/^\\/reads\\/slots?(?:-brief|-make|-final)?$/.test(path)) return slotRoute(") > w.indexOf('async function readRoute(') && w.indexOf("if (/^\\/reads\\/slots?(?:-brief|-make|-final)?$/.test(path)) return slotRoute(") > w.indexOf("if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);", w.indexOf('async function readRoute(')),
  'W5 slotRoute is reached only after the admin check');
const chain = w.slice(w.indexOf('.then(() => popoutPass(env))'), w.indexOf('.then(() => claudeBatchDrain(env))'));
ok(chain.includes('.then(() => imageDescribePass(env))') && /which === 'describe' \? await imageDescribePass\(env, \{ max: Math\.min\(40, parseInt\(body\.max, 10\) \|\| 0\) \|\| undefined \}\) :/.test(w), 'W6 the describer runs in the 30-minute slice after the pop-out pass, and by hand as {run: describe}');
const stand = between('async function wkStandNew(', '/* SEAM:READ_PRUNE PURE: may this version go?');
ok(stand.includes('wkCoverCreditOf(row, coverCredit)') && stand.indexOf('wkCoverCreditOf(row, coverCredit)') < stand.indexOf('const issue = wkIssueFromRead('), 'W7 a new issue\'s cover credit follows the cover slot when the cover is the rendered page');
const rep = w.slice(w.indexOf("if (path === '/reads/weekly-stand') {"), w.indexOf("if (path === '/reads/shelf') {"));
const door = w.slice(w.indexOf("if (path === '/reads/weekly-cover') {"), w.indexOf("if (path === '/reads/weekly-stand') {"));
ok(/patch\.cover_credit = wkCoverCreditOf\(row, null\)/.test(rep) && /body: \{ cover_credit: cc \}/.test(door) && /body: \{ cover_key: key \}/.test(door), 'W8 a recut and a re-rendered cover carry the slot\'s credit to the stand');
ok(/^const IMAGE_BRIEF = ".*";\s+\/\/ SEAM:BRIEF_SYNC/m.test(w) && /^const IMAGE_BRIEF_REV = 'house-v2';/m.test(w), 'W9 the brief and its version are constants the gate keeps in sync');

// ── P: the page ───────────────────────────────────────────────────────
ok(/var MIN = \{ cover: 1200, hero: 1000, wide: 380, strip: 380, thumb: 160, frame: 800, slot: 600 \}/.test(page), 'P1 mosaics and strips accept the 400 px thumbnail; a slot the house picked stands above 600');
ok(/var thumb = slot === "wide" \|\| slot === "strip"/.test(page) && /u = u\.replace\("\/img\/s\/", "\/img\/t\/"\)/.test(page) && /data-thumb="1"/.test(page) && /el\.getAttribute\("data-thumb"\) \? "\/img\/t\/" : "\/img\/s\/"/.test(page),
  'P2 wide and strip photographs are drawn as thumbnails, and stay thumbnails when the slot steps to its next candidate');
ok(/function slotOf\(path\)/.test(page) && /function slotImg\(s, slot\)/.test(page) && /API \+ "\/media\/" \+ s\.ref/.test(page) && /data-min="' \+ MIN\.slot \+ '"/.test(page), 'P3 a slot draws a house image from /media or a story photograph through the relay, at the slot floor');
ok(/var coverSlot = slotOf\("cover"\)/.test(page) && /coverSlot \? slotImg\(coverSlot, "cover"\) : \(coverS \? photo\(coverS, "cover", coverPool\.slice\(1\)\) : ""\)/.test(page) && /coverSlot && coverSlot\.kind === "type" \? " type" : ""/.test(page) && /if \(coverS && !coverSlot\) used\[coverS\] = 1;/.test(page),
  'P4 the cover slot wins over the writer\'s cover; the typographic block marks the page; the story the slot replaced is free for the inside');
ok(/var pslot = slotOf\(mainKey \+ "\[" \+ i \+ "\]"\)/.test(page) && /var heroHtml = pslot \? \(pslot\.kind === "type" \? "" : slotImg\(pslot, "hero"\)\)/.test(page) && /var heroCredit = pslot \? slotCredit\(pslot\)/.test(page) && /if \(lead && !pslot\) used\[lead\] = 1;/.test(page),
  'P5 a finding\'s hero follows its slot, with the slot\'s credit');
ok(/id="slots">The slots<\/button>/.test(page) && /function slotsOpen\(row, note\)/.test(page) && /call\("\/reads\/slots", \{ id: row\.id \}\)/.test(page) && /call\("\/reads\/slot-make", \{ id: row\.id, path: p, brief: b, n: 4/.test(page) && /call\("\/reads\/slot-final", \{ id: row\.id, path: p, rights_id: dr\.rights_id \}\)/.test(page) && /pick: \{ story: which, object_sentence: sent \}/.test(page) && /pick: \{ type: true \}/.test(page) && /pick: \{ clear: true \}/.test(page) && /body\.override = why;/.test(page),
  'P6 the slot panel: the brief, four drafts, the final, the object of the finding with its sentence, typographic, clear, and an override with a reason');
ok(/data-over="1"/.test(page) && /Use anyway/.test(page) && /window\.prompt\("This draft failed a hard check/.test(page), 'P7 a flagged draft is shown, not hidden, and can be used only with a reason on the record');
ok(!/—/.test(page.slice(page.indexOf('SEAM:READ_SLOTS: the slot panel'), page.indexOf('function slotsBind(row)') + 6000)), 'P8 no em dash in the panel\'s copy');

// ── G: migration ──────────────────────────────────────────────────────
ok(/create table if not exists media_rights/.test(mig) && /kind in \('house', 'press', 'cc', 'story_obj', 'story_thumb', 'type'\)/.test(mig) && /basis in \('AIR', 'EDIT', 'CC', 'OBJ', 'THUMB', 'A'\)/.test(mig) && /contexts text\[\]/.test(mig) && /object_sentence text/.test(mig) && /made jsonb/.test(mig),
  'G1 media_rights carries kind, basis, contexts, the object sentence and how a house image was made');
ok(/alter table edition_items add column if not exists image_desc text/.test(mig) && /image_desc_at timestamptz/.test(mig) && /enable row level security/.test(mig) && /grant select, insert, update on media_rights to service_role/.test(mig), 'G2 the lake keeps a description per photograph; the table is the worker\'s alone');
console.log(`\nproof_slots: ${pass} checks passed`);
