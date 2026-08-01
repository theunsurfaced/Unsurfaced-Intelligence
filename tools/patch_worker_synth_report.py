#!/usr/bin/env python3
# patch_worker_synth_report.py — EX-EVO-1B, worker side.
# Target: worker/src/index.js. Applies on top of patch_worker_deep.py.
#
# synthesize() grows a report mode. Same grounding laws (numbered evidence,
# copied citations, invent nothing), three additions:
#   1. THE READ — the house two-liner: reframe, then actionable move.
#   2. Per-insight "implication" — what this means for a brand decision,
#      the sentence that separates intelligence from retrieval.
#   3. EARNED confidence — assigned server-side from evidence density per
#      category, never by the model and never hardcoded: 3+ corroborating
#      items High, 2 Medium, 1 Low. A confidence label you can defend.
# Non-report callers (the EXPLORE flow at its existing call site) see zero
# contract change.

import io, os

PATH = os.environ.get('WORKER_PATH', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── R1: the prompt learns report mode ───────────────────────────────────────
rep(
"""    const usr = `Topic: \"${query}\"\\n\\nEVIDENCE:\\n${evidence}\\n\\n` +
      'Return JSON exactly shaped as:\\n' +
      '{\"insights\":[{\"category\":\"consumer|market|culture|brand\",\"title\":\"<=9-word claim\",' +
      '\"excerpt\":\"1-2 sentence finding grounded in the evidence\",\"source\":\"copied from evidence\",' +
      '\"sourceUrl\":\"copied from evidence\"}],' +
      '\"ideas\":[{\"type\":\"Positioning|Product|Campaign|Content|Partnership\",\"headline\":\"<=9 words\",' +
      '\"body\":\"1-2 sentence recommendation tied to the insights\"}],' +
      '\"brief\":\"3-4 sentence executive read of where the conversation actually is and what to do about it\"}\\n' +
      'Give 6-8 insights spread across the categories the evidence supports, and 4-6 ideas. JSON only.';""",
"""    /* SEAM:INSIGHT_COMPILER — report mode adds the house shape. The two-liner
     * law is Unsurfaced's own: line one reframes what the evidence actually
     * says, line two is the move it implies. "implication" is the sentence
     * that separates intelligence from retrieval — every finding must answer
     * "so what does a brand DO about this". */
    const isReport = body.mode === 'report';
    const usr = `Topic: \"${query}\"\\n\\nEVIDENCE:\\n${evidence}\\n\\n` +
      'Return JSON exactly shaped as:\\n' +
      '{' + (isReport ? '\"read\":[\"line 1: one sharp sentence reframing what the evidence actually shows\",' +
      '\"line 2: one sentence naming the move it implies\"],' : '') +
      '\"insights\":[{\"category\":\"consumer|market|culture|brand\",\"title\":\"<=9-word claim\",' +
      '\"excerpt\":\"1-2 sentence finding grounded in the evidence\",' +
      (isReport ? '\"implication\":\"1 sentence: what this means for a brand decision\",' : '') +
      '\"source\":\"copied from evidence\",' +
      '\"sourceUrl\":\"copied from evidence\"}],' +
      '\"ideas\":[{\"type\":\"Positioning|Product|Campaign|Content|Partnership\",\"headline\":\"<=9 words\",' +
      '\"body\":\"1-2 sentence recommendation tied to the insights\"}],' +
      '\"brief\":\"3-4 sentence executive read of where the conversation actually is and what to do about it\"}\\n' +
      (isReport ? 'Never restate source counts or citation totals as findings — say what the evidence MEANS. ' +
      'If evidence items disagree, make one insight name the disagreement plainly. ' : '') +
      'Give 6-8 insights spread across the categories the evidence supports, and 4-6 ideas. JSON only.';""",
'R1 report-mode prompt')

# ── R2: earned confidence + read in the response ────────────────────────────
rep(
"""    const insights = parsed.insights.slice(0, 8).map(x => ({
      category: ['consumer', 'market', 'culture', 'brand'].includes(x.category) ? x.category : 'consumer',
      title: String(x.title || '').slice(0, 120),
      excerpt: String(x.excerpt || '').slice(0, 400),
      source: String(x.source || '').slice(0, 120),
      sourceUrl: /^https?:\\/\\//.test(String(x.sourceUrl || '')) ? x.sourceUrl : null
    })).filter(x => x.title);""",
"""    // Earned confidence: density of corroborating evidence in the insight's
    // own category. Never hardcoded, never the model's opinion of itself.
    const catDensity = {};
    for (const c of merged) {
      const k = ['consumer', 'market', 'culture', 'brand'].includes(c.lens) ? c.lens : 'consumer';
      catDensity[k] = (catDensity[k] || 0) + 1;
    }
    const earned = (cat2) => (catDensity[cat2] || 0) >= 3 ? 'High' : (catDensity[cat2] || 0) === 2 ? 'Medium' : 'Low';
    const insights = parsed.insights.slice(0, 8).map(x => ({
      category: ['consumer', 'market', 'culture', 'brand'].includes(x.category) ? x.category : 'consumer',
      title: String(x.title || '').slice(0, 120),
      excerpt: String(x.excerpt || '').slice(0, 400),
      implication: String(x.implication || '').slice(0, 300) || null,
      confidence: earned(['consumer', 'market', 'culture', 'brand'].includes(x.category) ? x.category : 'consumer'),
      source: String(x.source || '').slice(0, 120),
      sourceUrl: /^https?:\\/\\//.test(String(x.sourceUrl || '')) ? x.sourceUrl : null
    })).filter(x => x.title);
    const read = (Array.isArray(parsed.read) ? parsed.read : []).slice(0, 2)
      .map(x => String(x || '').slice(0, 220)).filter(Boolean);""",
'R2 earned confidence + read')

# ── R3: read rides the payload ──────────────────────────────────────────────
rep(
"    return json({ ok: true, data: { insights, ideas, brief, signals: added, connectors: serverConnectors(added) } }, 200, origin, env);",
"    return json({ ok: true, data: { insights, ideas, brief, read: read.length === 2 ? read : null,\n"
"      evidence_n: merged.length, signals: added, connectors: serverConnectors(added) } }, 200, origin, env);",
'R3 read in payload')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
