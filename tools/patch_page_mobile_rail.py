#!/usr/bin/env python3
# patch_page_mobile_rail.py — SEAM:MOBILE_RAIL. Portrait first-class.
# Target: intelligence/index.html. The old 700px breakpoint DELETED the nav
# (display:none, no replacement) — why phones had to rotate. Snap-scroll nav
# rail, single-column grids, breathing dashboard overlay, 40px tap targets,
# 16px inputs (kills iOS zoom-on-focus).

import io, os

PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
OLD = '@media(max-width:700px){nav{padding:0 20px;}.nav-links{display:none;}.hero,.main{padding-left:20px;padding-right:20px;}#live-results{padding-left:20px;padding-right:20px;}.results-grid,.ideas-grid{grid-template-columns:1fr;}.results-stats{flex-direction:column;gap:8px;}.modal-options{grid-template-columns:1fr;}.brand-row{flex-direction:column;}.deep-cta-strip{flex-direction:column;}}'
NEW = '/* SEAM:MOBILE_RAIL — portrait is a first-class citizen. The old breakpoint\n   DELETED the nav under 700px (display:none, no replacement) — the reason\n   phones had to rotate. Replaced with the snap-scroll rail: every tab one\n   thumb-swipe away, nothing hidden, terminal aesthetic intact. Grids fall to\n   one column, the dashboard overlay breathes, tap targets grow. */\n@media(max-width:700px){\n  nav{padding:0 14px;gap:10px;}\n  .nav-links{display:flex;overflow-x:auto;white-space:nowrap;gap:18px;padding:4px 2px 8px;margin:0;\n    scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex:1;min-width:0;}\n  .nav-links::-webkit-scrollbar{display:none;}\n  .nav-links li{scroll-snap-align:start;flex:0 0 auto;}\n  .nav-links a{font-size:11px;padding:8px 2px;display:inline-block;}\n  .nav-right{gap:8px;flex:0 0 auto;}\n  .nav-right>*{font-size:10px !important;padding:8px 10px !important;}\n  .ticker-bar{height:32px;font-size:10px;}\n  .ticker-label{font-size:9px;padding:0 10px;}\n  .hero,.main{padding-left:16px;padding-right:16px;}\n  .main{display:block;}\n  #live-results{padding-left:16px;padding-right:16px;}\n  .hero h1,.hero-title{font-size:clamp(30px,9vw,44px);}\n  .results-grid,.ideas-grid,.insights-grid,.audience-grid,.lens-ideas-row,\n  .idb-overview-grid,.idb-quad-grid,.idb-sources-grid,.idb-actions-grid,.idb-quad-actions{grid-template-columns:1fr;}\n  .truth-signals{grid-template-columns:1fr 1fr;}\n  .idb-finding{grid-template-columns:1fr;}\n  .results-stats{flex-direction:column;gap:8px;}\n  .modal-options{grid-template-columns:1fr;}\n  .brand-row{flex-direction:column;}\n  .deep-cta-strip{flex-direction:column;}\n  .idb-overlay,.idb-content{padding-left:14px !important;padding-right:14px !important;}\n  .idb-title{font-size:clamp(22px,7vw,30px) !important;}\n  button,.mr-btn,.brand-card-btn{min-height:40px;}\n  input,select,textarea{font-size:16px;}\n}'
n = s.count(OLD)
assert n == 1, f'ANCHOR FAIL [M1 mobile rail]: count={n} (expected 1)'
s = s.replace(OLD, NEW)
io.open(PATH, 'w', encoding='utf-8').write(s)
print('  OK  M1 mobile rail · WROTE ' + PATH + f' ({len(s)} chars)')
