#!/usr/bin/env python3
# patch_page_insight_compiler.py — EX-EVO-1B, page side.
# Target: intelligence/index.html. Applies on top of patch_page_evolution1.py
# (and the csp_frame patch).
#
# The finding that shaped this cut: reports went READY on an animation timer —
# setInterval with random increments completed the report while three fetches
# raced in the background. Data never gated readiness. Now it does:
#   1. The corpus gathers, then flows through /excavate/synthesize (report
#      mode) — the judgment layer that existed all along. Completion awaits
#      the answer. The progress bar parks at 94% until synthesis lands.
#   2. THE READ renders on the card; the brief becomes the synthesized one;
#      insights carry implication + earned confidence.
#   3. Fallback is honest: synthesis unavailable → the report ships as
#      "RETRIEVAL SUMMARY" with confidence demoted to Unverified — never
#      dressed as intelligence.
#   4. The lens builder's padding loop stops minting "N sources queried"
#      findings, and the "Signal Signal" doubling dies.
#   5. Truth chips: modeled brand scores and the audience panel say MODELED
#      on their face until the lake computes them for real (EVO-3).

import io, os

PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── I1: the fetch stores a corpus, not just template cards ──────────────────
rep(
"    if (ins.length) rpt.insights = ins;\n  } catch(e) { /* silent */ }\n}",
"""    if (ins.length) rpt.insights = ins;
    /* SEAM:INSIGHT_COMPILER — the raw evidence rides with the report so the
       compiler judges sources, not our template summaries of them. */
    rpt._corpus = ins.map(x => ({ lens: x.category, source: x.source,
      title: x.title, text: x.excerpt, url: x.sourceUrl || null }));
    rpt._fetched = true;
  } catch(e) { const rpt2 = _reportStore.find(r => r.id === id); if (rpt2) rpt2._fetched = true; }
}""",
'I1 corpus stored')

# ── I2: the animation parks; data completes the report ──────────────────────
rep(
"""  let prog = 0;
  const pi = setInterval(() => {
    prog += Math.random() * 8 + 3;
    if (prog >= 100) { prog = 100; clearInterval(pi); _completeReport(id, q); }
    const r = _reportStore.find(r => r.id === id);
    if (r) { r.progress = Math.round(prog); renderReportCards(); }
  }, 380);""",
"""  /* SEAM:INSIGHT_COMPILER — the bar is theater; the completion is not. It
     parks at 94 until the evidence is in AND the compiler has answered. A
     report that says READY has been judged, not animated. */
  let prog = 0;
  const pi = setInterval(() => {
    prog += Math.random() * 8 + 3;
    const r = _reportStore.find(r => r.id === id);
    if (prog >= 94) {
      prog = 94;
      if (r && r._fetched && !r._compiling) { r._compiling = true; clearInterval(pi); _completeReport(id, q); }
    }
    if (r) { r.progress = Math.round(prog); renderReportCards(); }
  }, 380);""",
'I2 data gates readiness')

# ── I3: completion runs the compiler, falls back honestly ───────────────────
rep(
"""function _completeReport(id, q) {
  const rpt = _reportStore.find(r => r.id === id);
  if (!rpt) return;
  rpt.status = 'ready'; rpt.progress = 100;
  rpt.summary = `Intelligence report on \"${q}\" synthesizing open-source signals.${rpt._oaCount ? ' ' + rpt._oaCount.toLocaleString() + ' academic papers indexed.' : ''}${rpt._hnCount ? ' ' + rpt._hnCount.toLocaleString() + ' HN discussions.' : ''} Findings and strategic recommendations ready for download.`;
  rpt.ideas = buildIdeas(q, rpt.insights.length ? rpt.insights : [{category:'brand',title:'',excerpt:'',stat:'',confidence:'Medium',source:''}], 'basic');
  renderReportCards();
  _addToDeployQueue(q, rpt.type, rpt.mode);
  showToast('Report ready — ' + q.slice(0,28));
}""",
"""async function _completeReport(id, q) {
  const rpt = _reportStore.find(r => r.id === id);
  if (!rpt) return;
  /* SEAM:INSIGHT_COMPILER — the judgment layer. Evidence in, house shape
     out: THE READ (reframe, then move), findings carrying implication and
     EARNED confidence, a brief that says what the conversation means. When
     the compiler cannot answer, the report ships wearing its true name —
     RETRIEVAL SUMMARY — with confidence demoted, never dressed up. */
  let compiled = null;
  if ((rpt._corpus || []).length) {
    try {
      const d = await api('excavate/synthesize', { query: q, mode: 'report', corpus: rpt._corpus });
      if (d && d.ok && d.data && (d.data.insights || []).length) compiled = d.data;
    } catch (e) { /* fall through to the honest fallback */ }
  }
  rpt.status = 'ready'; rpt.progress = 100;
  if (compiled) {
    rpt.read = compiled.read || null;
    rpt.summary = compiled.brief || '';
    rpt.insights = compiled.insights.map(x => ({ category: x.category, title: x.title,
      excerpt: x.excerpt + (x.implication ? ' \\u2192 ' + x.implication : ''),
      stat: x.source, confidence: x.confidence, source: x.source, sourceUrl: x.sourceUrl }));
    rpt.ideas = (compiled.ideas || []).map(x => ({ type: x.type, headline: x.headline, body: x.body }));
    rpt.compiled = true;
  } else {
    rpt.read = null; rpt.compiled = false;
    rpt.summary = 'RETRIEVAL SUMMARY \\u2014 synthesis unavailable for this run. Raw source signals below; regenerate to retry the compiler. '
      + (rpt._oaCount ? rpt._oaCount.toLocaleString() + ' academic papers indexed. ' : '')
      + (rpt._hnCount ? rpt._hnCount.toLocaleString() + ' practitioner discussions. ' : '');
    rpt.insights = (rpt.insights || []).map(x => Object.assign({}, x, { confidence: 'Unverified' }));
    rpt.ideas = buildIdeas(q, rpt.insights.length ? rpt.insights : [{category:'brand',title:'',excerpt:'',stat:'',confidence:'Unverified',source:''}], 'basic');
  }
  renderReportCards();
  _addToDeployQueue(q, rpt.type, rpt.mode);
  showToast(rpt.compiled ? 'Report compiled \\u2014 ' + q.slice(0, 28) : 'Report ready (retrieval only) \\u2014 ' + q.slice(0, 28));
}""",
'I3 compiler completion')

# ── I4: the card leads with THE READ when it exists ─────────────────────────
rep(
"        ${rpt.status==='generating'?'⟳ GENERATING':'✓ READY'}",
"        ${rpt.status==='generating'?'⟳ GENERATING':(rpt.compiled===false?'✓ READY · RETRIEVAL':'✓ READY')}",
'I4a card badge tells the truth')

# ── I5: the padding loop stops minting fake findings ────────────────────────
rep(
"""  // ── Fallback if insufficient data ─────────────────────────────────
  while (insights.length < 3) {
    insights.push({
      category:cat, title:`${catLabel} Signal: "${q.split(' ').slice(0,4).join(' ')}"`,
      excerpt: `Open-source ${catLabel.toLowerCase()} intelligence for "${q}" is being synthesised across ${si-1} data sources. ${si>3?'Initial signals confirm detectable activity.':'Some sources returned limited data — activate Deep Search for quantified intelligence from industry authorities.'} Intelligence depth increases with source diversity across the full 15-source pipeline.`,
      stat: `${si-1} sources queried`, confidence:'Medium', source:'Synthesis', sourceUrl:null,
    });
  }
""",
"""  /* SEAM:INSIGHT_COMPILER — the padding loop is dead. An empty lens says so
     ONCE, honestly, at Low confidence — it does not mint three findings out
     of its own retrieval arithmetic. ("Signal Signal" died here too: the
     label already names the lens; the template stops re-suffixing it.) */
  if (!insights.length) {
    insights.push({
      category:cat, title:`${catLabel}: evidence thin for "${q.split(' ').slice(0,4).join(' ')}"`,
      excerpt: `The open sources answered lightly on this lens — not enough corroboration to state a finding. That is itself a signal: the conversation here is early, niche, or happening on closed platforms. Deep Search reaches further.`,
      stat: 'insufficient evidence', confidence:'Low', source:'Excavate', sourceUrl:null,
    });
  }
""",
'I5 padding loop dies')

# ── I6: truth chips — modeled numbers say so ────────────────────────────────
rep(
"      <div style=\"font-family:'Space Mono',monospace;font-size:10px;color:var(--text3);letter-spacing:0.06em;\">Open-source panel synthesis · n≈14,847</div>",
"      <div style=\"font-family:'Space Mono',monospace;font-size:10px;color:var(--text3);letter-spacing:0.06em;\">MODELED — illustrative segmentation · live panel wiring in progress</div>",
'I6a audience panel truth chip')

rep(
"  { name:\"Nike\",          ticker:\"NKE\",  sector:\"Lifestyle & Apparel\", cat:\"lifestyle\",",
"  /* SEAM:INSIGHT_COMPILER — these scores are MODELED fixtures until EVO-3\n"
"     computes them from the lake (state, momentum, recurrence) and MINE\n"
"     (primary research). The card renderer badges them accordingly \\u2014 a\n"
"     number without lineage never again renders as a measurement. */\n"
"  { name:\"Nike\",          ticker:\"NKE\",  sector:\"Lifestyle & Apparel\", cat:\"lifestyle\",",
'I6b fixture confession comment')

rep(
'<span style="color:var(--text3)">30-day signal</span>',
'<span style="color:var(--text3)">30-day signal · modeled</span>',
'I6c trend line badged')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
