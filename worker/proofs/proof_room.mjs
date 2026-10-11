/**
 * proof_room.mjs  --  EX35a THE ROOM: SEAM:CLIENT_ROOM.
 * The reader's profile is a room with four panels in reading order, opened from the avatar; the save knows when there is something to save.
 * Run from the repo root.
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const room = between(page, 'async function _profileOpen() {', 'function _profileClose()');
const order = ['id="rm-you"', 'id="rm-frame"', 'id="rm-reach"', 'id="rm-shelf"', 'class="rm-save"'].map(s => room.indexOf(s));
ok(order.every(i => i > 0) && order.every((v, i, a) => i === 0 || v > a[i - 1]), 'A1 four panels in reading order (You, Your frame, How it reaches you, Your shelf), then the save');
ok(/id="pm-name"/.test(room) && /id="pm-title"/.test(room) && /id="pm-company"/.test(room) && /id="pm-role"/.test(room) && /class="rm-avatar"/.test(room) && /class="rm-email"/.test(room), 'A2 You: picture, name, title, company, role; the email shown, not edited');
ok(/id="pm-tracked-chips"/.test(room) && /id="pm-tracked-add"[^>]*onkeydown="if\(event\.key==='Enter'\)\{event\.preventDefault\(\);_brandAdd\(\);\}"/.test(room) && /<input type="hidden" id="pm-tracked"/.test(room) && /function _brandAdd\(\)/.test(page) && /function _brandRemove\(i\)/.test(page) && /Twelve brands is the most a frame holds/.test(page),
  'A3 the brands as chips with an add field; the hidden list the save reads; twelve at most');
ok(/<details class="rm-panel rm-fold" id="rm-reach"\$\{first \? '' : ' open'\}>/.test(room) && /<details class="rm-panel rm-fold" id="rm-shelf"\$\{first \? '' : ' open'\}>/.test(room) && /<details class="rm-more"><summary>Add a channel<\/summary>/.test(room) && /id="pm-slack"/.test(room) && /id="pm-teams"/.test(room) && /id="pm-day"/.test(room) && /id="pm-email"/.test(room),
  'A4 the channels and the shelf fold on the first entry; Slack and Teams behind Add a channel');
ok(/class="rm-drop" id="rm-drop"[^>]*ondrop="event\.preventDefault\(\);this\.classList\.remove\('over'\);_evidenceUpload\(\{ files: event\.dataTransfer\.files \}\)"/.test(room) && /YOUR SHELF/.test(room) && /<details class="rm-more"><summary>Paste text instead<\/summary>/.test(room) && /id="pm-ev-text"/.test(room) && /id="pm-evidence-list"/.test(room),
  'A5 the shelf: one drop zone, the list, paste text as the second way');
ok(/id="pm-save" onclick="_profileSubmit\(\)"\$\{first \? '' : ' disabled'\}>\$\{first \? 'Set my frame' : 'Save'\}<\/button>/.test(room) && /function _profileDirty\(\) \{ const b = document\.getElementById\('pm-save'\)/.test(page) && /x\.addEventListener\('input', _profileDirty\); x\.addEventListener\('change', _profileDirty\);/.test(room) && /e\.key === 'Escape'/.test(room),
  'A6 the save lights only when something changed, reads Set my frame on the first entry; Escape closes');
ok(/<div class="nav-user-avatar" onclick="event\.stopPropagation\(\); _profileOpen\(\)" title="Your profile">/.test(page) && /onclick="_profileOpen\(\)">Your profile<\/button>/.test(page), 'A7 the avatar opens the room; the menu still has Your profile');
const submit = between(page, 'async function _profileSubmit() {', 'async function _profileUnfollow');
ok(/_sb\.auth\.updateUser\(\{ data \}\)/.test(submit) && /first_name: parts\[0\]/.test(submit) && /company, role: title/.test(submit) && /_navUserRefresh\(\)/.test(submit) && /function _navUserRefresh\(\)/.test(page) && /localStorage\.setItem\('uai_frame_set', '1'\)/.test(submit),
  'A8 name, title and company save to the account and the nav follows; the frame flag still sets on the first save');
ok(/class="rm-item"><span class="rm-item-kind">/.test(page) && /read, \$\{safe\(String\(it\.chunks\)\)\} parts/.test(page) && /Nothing on the shelf yet\. Drop a file or paste text\./.test(page) && /rm-shelf-hint/.test(page), 'A9 each shelf item says what it is and what the house did with it');
ok(/\.rm-save\{position:sticky;bottom:0;/.test(page) && /@media \(max-width:640px\)\{\.pm\.room\{/.test(page) && /\.pm\.room\{max-width:760px/.test(page), 'A10 the save follows the reader; the room stacks on a phone');
console.log('proof_room: ' + pass + ' checks passed');
