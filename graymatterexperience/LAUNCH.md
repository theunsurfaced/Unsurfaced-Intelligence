# graymatterexperience: launch play by play

Surface: `https://unsurfaced-intelligence.com/graymatterexperience/`
Seam: `SEAM:GME_BROOKS` (registered in `seams.json`, tagged in `graymatterexperience/index.html`)
Shipped by: `gme_launch/patch_gme_launch.py` (kept in `~/Desktop/patches`, outside the repo)

Page-only. No worker change, no `wrangler deploy`, no migration.

## 1. Stage the patch

The patch folder lives in `~/Desktop/patches`, never in the repo.

```zsh
ls -d ~/Downloads/gme_launch*            # find the unzipped folder
mkdir -p ~/Desktop/patches
mv ~/Downloads/gme_launch ~/Desktop/patches/
ls ~/Desktop/patches/gme_launch          # EXPORT-NOTES.md  PAYLOAD.sha256  README.md  patch_gme_launch.py  payload
```

If `mv` reports the folder exists, `rm -rf ~/Desktop/patches/gme_launch` and move again.

## 2. Start from a clean main

GitHub Desktop: Fetch origin, Pull. The Changes tab shows 0 files.

## 3. Dry run

```zsh
python3 ~/Desktop/patches/gme_launch/patch_gme_launch.py
```

Expect:

```
  repo      ok (https://github.com/theunsurfaced/unsurfaced-intelligence)
  payload   105 files, checksums verified, SEAM:GME_BROOKS tagged once
  folder    graymatterexperience/: will be added (105 files)
  seams     SEAM:GME_BROOKS: will be registered
  readme    surface map: will add /graymatterexperience/
DRY RUN OK. Re-run with --apply to write.
```

`REFUSED: tools/ritual_gate.py not found` means the repo is not at
`~/Documents/GitHub/Unsurfaced-Intelligence`; add `--repo /path/to/repo` to every command.

## 4. Apply

```zsh
python3 ~/Desktop/patches/gme_launch/patch_gme_launch.py --apply
```

Expect three writes, then the gate:

```
  wrote     graymatterexperience/ (105 files, verified)
  wrote     seams.json (+SEAM:GME_BROOKS)
  wrote     README.md (surface map +/graymatterexperience/)
  ...
  js      graymatterexperience/index.html: 1 scripts
RITUAL GATE: PASS
```

On `RITUAL GATE: FAIL`: stop, run `--revert`, send the output.

## 5. Commit

GitHub Desktop shows 107 files: 105 new under `graymatterexperience/`, `seams.json` (+4 lines), `README.md` (+1 line).

- Summary: `GME LAUNCH: graymatterexperience page (SEAM:GME_BROOKS)`
- Commit to main, Push origin (about 57 MB; the push runs longer than usual).

## 6. Watch the deploy

- GitHub, Actions: the ritual gate on the push goes green.
- Cloudflare, Workers & Pages, the Pages project, Deployments: the new deploy reads Success.

## 7. Verify live

Open `https://unsurfaced-intelligence.com/graymatterexperience/`:

- Header: Unsurfaced™ mark, Gray Matter badge.
- Tap a tile: plays in place with sound and captions; the other tiles dim.
- `?v=3` opens with tile 03 selected and ready.
- Gallery: group shot leads, "Photos by Nick Moody" in the header, every photo opens full-screen. `?p=5` opens photo 05.
- Repeat on a phone, opening the link inside the LinkedIn app.

## 8. Prime the share card

LinkedIn Post Inspector (`linkedin.com/post-inspector`): paste the URL. Expect the Unsurfaced™ × Gray Matter grid image and the title
"In Conversation: Gray Matter Experience × Brooks College Prep". If the image is missing, inspect again after a minute.

## 9. Launch checks

- Gray Matter's photo release covers students' faces online (group and applause shots).
- Captions proofread by ear before posting.

## Undo

Before committing:

```zsh
python3 ~/Desktop/patches/gme_launch/patch_gme_launch.py --revert
```

Removes `graymatterexperience/`, the seam entry and the README line; the tree returns to main.
After pushing: revert the commit in GitHub Desktop (History, right-click, Revert Changes in Commit) and push.

## Re-cut

The patch refuses to overwrite a `graymatterexperience/` that differs from its payload. A changed page ships as a new patch
(`gme_*`) with its own checksums, never as hand edits in the repo.
