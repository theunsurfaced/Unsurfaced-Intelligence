# The bench (SEAM:BENCH, EX29)

The writer's quality, measured. Twenty fixed questions, each with an evidence pack frozen once from a real gather, written by the live writer and graded against the laws: the code's checks (the headline's length and purity, the dek's figure, every number in its evidence, no dash, the moves count and their findings, the brief) and one Haiku rubric (say it once, confidence frames the claim, limits first, on the frame, specific). Score 0 to 100; the floor is 70.

## Once

    node tools/bench/freeze.mjs --base https://api.unsurfaced-intelligence.com --key $DESK_API_KEY

Freezes `tools/bench/packs/q01.json` to `q20.json`. Commit them. Refreeze only when the rails change on purpose.

## Every writer change

1. Upload the version without promoting it: `cd worker && npx wrangler versions upload --message "..."`. Wrangler prints the version's preview URL.
2. Run the bench against it: `node tools/bench/run.mjs --base https://<preview>.workers.dev --key $DESK_API_KEY` (about $0.50). It writes `tools/bench/last.json` with the writer's hash from your local worker file.
3. `python3 tools/ritual_gate.py`: the gate's bench step fails when `last.json` is missing, below the floor, or hashed on a different writer than the one in `worker/src/index.js`.
4. Promote: `npx wrangler versions deploy` (or `npx wrangler deploy`).

A change that touches none of the writer's slices (the laws, the prompts, the room) leaves the hash alone and the bench need not run.

## The human score

`tools/bench/human.json` holds `{ "q01": 8, "q04": 6, ... }`: the score out of 10 Fresco and Josh give five of the reads after reading them. `run.mjs` carries it into `last.json` as `human_mean`. Score the same five each time so the number means the same thing.
