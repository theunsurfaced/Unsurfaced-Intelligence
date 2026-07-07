# /worker — unsurfaced-api

The live Worker (currently in `theunsurfaced/test`) moves into `worker/src/`.
Point Cloudflare's git build config at root directory `/worker`.

Migration steps:
1. Copy existing Worker source into `worker/src/` (entry: `src/index.js`)
2. In Cloudflare: Settings → Build → Root directory = `/worker`, re-verify the
   git connection after the repo rename
3. Enable Workers Logs (Observability tab) — required before pipeline work
4. Create the ECOSYSTEM_KV namespace, uncomment its block in wrangler.toml
5. Uncomment [triggers] when the DAILY pipeline ships (build step 5)

New routes land here per the plan's seams:
  SEAM:ACTIVITY_LOG   — logEvent() called by every endpoint     (step 3)
  SEAM:MODEL_POOL     — callModel(tier, payload, opts) router   (step 5a)
  SEAM:KNOWLEDGE_INGEST — drop → parse → embed pipeline         (step 6)
  SEAM:OPS_AUTH       — admin JWT + DB role verification gate   (step 8)
