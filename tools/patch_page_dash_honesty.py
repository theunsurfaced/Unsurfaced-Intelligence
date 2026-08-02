#!/usr/bin/env python3
# patch_page_dash_honesty.py — dashboard padding dies + moat hooks hardened.
# Target: intelligence/index.html. Applies on top of patch_page_brand_signal.py.
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
rep("""  // ── Ensure at least 6 insights ──
  while(insights.length<6){
    insights.push({
      category:CATS[insights.length%4],
      title:`Signal Analysis: "${q.split(' ').slice(0,4).join(' ')}" — Cross-Source Intelligence`,
      excerpt:`Multiple open-source intelligence streams corroborate active signal strength for this topic. Cross-referencing Wikipedia knowledge depth, OpenAlex academic volume, arXiv frontier research, and practitioner discourse reveals a category with ${insights.length>3?'high':'moderate'} research investment and growing strategic relevance. Activate Deep Search for real-time quantified consumer and market data from authoritative industry sources.`,
      stat:'↑ Multi-source confirmed',confidence:'Medium',source:'Synthesis',sourceUrl:null,
    });
  }
""", """  /* SEAM:INSIGHT_COMPILER — dashboard padding dead, same law as reports:
     an empty lens confesses once at Low; it never mints "Multi-source
     confirmed" out of its own arithmetic. */
  if(!insights.length){
    insights.push({
      category:cat||'consumer',
      title:`Evidence thin: "${q.split(' ').slice(0,4).join(' ')}"`,
      excerpt:`The open sources answered lightly here — not enough corroboration to state findings. That is a signal in itself: this conversation is early, niche, or living on closed platforms. Deep Search reaches further.`,
      stat:'insufficient evidence',confidence:'Low',source:'Excavate',sourceUrl:null,
    });
  }
""", 'H1 dashboard padding dies')
rep("""    // Pad to 6 if model returned fewer
    while (insights.length < 6) {
      insights.push({
        category: CATS[insights.length % 4],
        title:    `Deep Signal: "${q.split(' ').slice(0, 4).join(' ')}"`,
        excerpt:  `Perplexity Sonar Pro identified active signals for this topic. Additional intelligence is available — refine your query for more targeted findings.`,
        stat:     '↑ Signal confirmed', confidence: 'Medium', source: 'Perplexity Sonar Pro',
      });
    }""", """    /* SEAM:INSIGHT_COMPILER — the deep path keeps only what Sonar actually
       returned. Fewer than six real findings beats six with filler. */
    if (!insights.length) {
      insights.push({
        category: 'consumer',
        title: `Deep Search returned no structured findings`,
        excerpt: `Sonar answered but the response carried no extractable findings for this query. Refine the query or retry — nothing has been invented to fill the space.`,
        stat: 'no findings', confidence: 'Low', source: 'Excavate',
      });
    }
""", 'H2 deep padding dies')
rep("    setTimeout(function () { _brandLakeLoad(brand.name); }, 400);",
    "    setTimeout(function () { try { _brandLakeLoad(brand.name); } catch (e) {} }, 1400);",
    'H3a known-brand hook hardened')
rep("    setTimeout(function () { _brandLakeLoad(name); }, 400);",
    "    setTimeout(function () { try { _brandLakeLoad(name); } catch (e) {} }, 1400);",
    'H3b custom hook hardened')
assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
