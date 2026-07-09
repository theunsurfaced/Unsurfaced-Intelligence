/**
 * proof_archive.mjs — SEAM:ARCHIVE, both halves (needs: npm i jsdom).
 *   A  worker: archive index joins lead headlines; by-issue serves the
 *      today-shape; drafts never leak; bad issue refused
 *   D  daily: folio is the door; ?issue=NN boots that edition; the shelf
 *      lists issues and clicking one reloads in place with a deep link
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const html = fs.readFileSync('daily/index.html', 'utf-8');

/* ── A: worker half ── */
{
  const a = w.indexOf('async function editionArchive');
  const b = w.indexOf('// Manual trigger');
  const calls = [];
  const api = new Function('json', 'sbRest',
    w.slice(a, b) + '; return { editionArchive, editionByIssue };')(
    (o) => o,
    async (env, path) => {
      calls.push(path);
      if (path.startsWith('editions?status=eq.published&order=date.desc'))
        return [{ id: 9, issue_no: 3, date: '2026-07-10' }, { id: 7, issue_no: 2, date: '2026-07-09' }];
      if (path.startsWith('edition_items?edition_id=in.'))
        return [{ edition_id: 9, headline: 'Lead three' }, { edition_id: 7, headline: 'Lead two' }];
      if (path.startsWith('editions?issue_no=eq.2&status=eq.published'))
        return [{ id: 7, issue_no: 2, date: '2026-07-09', headline: '' }];
      if (path.startsWith('editions?issue_no=eq.99')) return [];
      if (path.startsWith('edition_items?edition_id=eq.7'))
        return [{ ord: 0, headline: 'Lead two', take: 'T' }];
      return [];
    });
  const ar = await api.editionArchive({}, '');
  ok(ar.ok && ar.issues.length === 2 && ar.issues[0].issue_no === 3 && ar.issues[0].lead === 'Lead three', 'A archive: newest first, leads joined');
  const by = await api.editionByIssue({ searchParams: new URLSearchParams('issue=2') }, {}, '');
  ok(by.edition && by.edition.issue_no === 2 && by.items.length === 1, 'A by-issue serves the today-shape');
  ok(calls.some(c => c.includes('status=eq.published') && c.includes('issue_no=eq.2')), 'A drafts can never leak: published filter on the by-issue read');
  ok((await api.editionByIssue({ searchParams: new URLSearchParams('issue=99') }, {}, '')).edition === null, 'A missing issue answers empty, not error');
  ok((await api.editionByIssue({ searchParams: new URLSearchParams('') }, {}, '')).error === 'bad_issue', 'A garbage refused');
}

/* ── D: daily half ── */
function world(qs) {
  const fetches = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://unsurfaced-intelligence.com/daily/' + (qs || ''), pretendToBeVisual: true,
    beforeParse(win) {
      win.fetch = async (url) => { const u = String(url); fetches.push(u); return { ok: true, status: 200, json: async () => {
        if (u.includes('/api/edition/archive')) return { ok: true, issues: [
          { issue_no: 2, date: '2026-07-09', lead: 'Lead two' }, { issue_no: 1, date: '2026-07-08', lead: 'Lead one' }] };
        return { edition: { issue_no: u.includes('issue=') ? +u.split('issue=')[1] : 3, date: '2026-07-10' },
          items: [{ kicker: 'K', headline: 'H', take: 'T', source_name: 'S', source_url: 'https://s.com/x' }] };
      }, text: async () => '{}' }; };
      win.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      win.MutationObserver = win.MutationObserver || class { observe(){} disconnect(){} };
      win.scrollTo = () => {};
    },
  });
  return { dom, fetches };
}
{
  const { dom, fetches } = world('');
  await sleep(500);
  const d = dom.window.document;
  ok(fetches.some(f => f.includes('/api/edition/today')), 'D no param: today boots');
  const folio = d.getElementById('folio');
  ok(folio && folio.tagName === 'BUTTON' && folio.textContent.includes('ISSUE 003'), 'D the folio is the door and wears the issue');
  await dom.window.openArchive(); await sleep(200);
  const rows = d.querySelectorAll('.ar-row');
  ok(rows.length === 2 && rows[0].textContent.includes('Lead two'), 'D the stand lists back issues with leads');
  rows[1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await sleep(200);
  ok(fetches.some(f => f.includes('/api/edition?issue=1')), 'D picking an issue reloads it in place');
  ok(dom.window.location.search === '?issue=1', 'D the deep link lands in the URL');
}
{
  const { dom, fetches } = world('?issue=2');
  await sleep(500);
  ok(fetches.some(f => f.includes('/api/edition?issue=2')) && !fetches.some(f => f.includes('/today')), 'D ?issue=2 boots straight into the back issue');
  ok(dom.window.document.getElementById('folio').textContent.includes('ISSUE 002'), 'D masthead wears the visited issue');
}
console.log('\nARCHIVE PROOF: ' + pass + '/' + pass + ' assertions PASS');
process.exit(0);
