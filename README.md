# Unsurfaced™ Ecosystem — Unified Codebase

One monorepo, two automatic deploy targets: GitHub Pages serves the surfaces from
root; Cloudflare builds the Worker from `/worker`. Single-file architecture per
surface. The ritual gate runs in CI on every push.

```
/                       UNSURFACED HOME    (brand site, GLB hand + brain embedded)
/daily/                 DAILY              (cultural intelligence publication)
/intelligence/          INTELLIGENCE       (Excavate — PLAY · EXCAVATE · MINE)
/arcade/                ARCADE HUB         (Hidden Hand Arcade landing)
/arcade/rps/            RPS
/arcade/claw/           CLAW
/arcade/pop-a-shot/     POP-A-SHOT
/worker/                unsurfaced-api     (Cloudflare Worker — build root /worker)
/supabase/migrations/   0005–0007          (leaderboard · knowledge base · activity)
/tools/ritual_gate.py   validation ritual, executable
/.github/workflows/     ritual-gate.yml    (gate runs on every push; red X blocks merge)
integrity.json          payload + font baselines
seams.json              seam registry (CI-enforced)
```

## Deploy
1. Push this repo to GitHub → Settings → Pages → deploy from `main` root.
2. `.nojekyll` is included so Pages serves the 13MB home file without Jekyll processing.
3. Custom domain (optional): add a CNAME and point DNS. All internal navigation is
   relative, so the site works at any origin — `*.github.io` or a custom domain.

## Wiring (post-deploy)
- **DAILY** — `daily/index.html` CONFIG block (line ~168): set `API_BASE`,
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Unconfigured, it shows the
  "Issue 001 is coming" holding state. Edit on GitHub only — straight quotes.
- **INTELLIGENCE** — already wired to `api.unsurfaced-intelligence.com`
  (Cloudflare Worker) and Supabase project `uxbhafkqungklmnrfdhp`. If serving
  from a new origin, confirm the Worker CORS allowlist and page CSP include it.

## Integrity baseline (ritual gate)
- `glb-hand`  sha256 `14b4ec43ef1fe475…5883f031`
- `glb-brain` sha256 `8e2549910bf1a266…4a06714b`
- All script blocks pass `node --check`; all internal links resolve.
Verify byte-identity after any future edit to `/index.html`.
