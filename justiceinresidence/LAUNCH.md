# justiceinresidence: launch play by play

Surface: `https://unsurfaced-intelligence.com/justiceinresidence/`
Seam: `SEAM:IC_C4C` (registered in `seams.json`, tagged in `justiceinresidence/index.html`)
Shipped by: `jir_launch/patch_jir_launch.py` (kept in `~/Desktop/patches`, outside the repo)

Page-only. No worker change, no `wrangler deploy`, no migration.

## 1. Cloudflare build command (do this first)

Pages publishes only the folders named in its build command. A new surface that is not listed falls back to the
homepage. Cloudflare, Workers & Pages, unsurfaced-intelligence, Settings, Build, Build command:

```
mkdir -p dist && cp -r index.html assets intelligence daily play arcade weekly deck graymatterexperience justiceinresidence dist/
```

Build output stays `dist`. Save. The push in step 6 builds with the new command.

## 2. Stage the patch

```zsh
SRC=$(find ~/Downloads ~/Desktop -maxdepth 4 -name patch_jir_launch.py 2>/dev/null | head -1); echo "$SRC"
```

## 3. Start from a clean main

GitHub Desktop: Fetch origin, Pull. The Changes tab shows 0 files.

## 4. Dry run

```zsh
python3 "$SRC"
```

Expect `payload 88 files, checksums verified`, the folder and seam to be added, the README line to be added, `DRY RUN OK`.

## 5. Apply

```zsh
python3 "$SRC" --apply
```

Expect three `wrote` lines, then `RITUAL GATE: PASS`. On FAIL: run `--revert`, send the output.

## 6. Commit

GitHub Desktop shows 90 files: 88 new under `justiceinresidence/`, `seams.json`, `README.md`.
Summary: `JIR LAUNCH: justiceinresidence page (SEAM:IC_C4C)`. Commit to main, Push origin.

## 7. Verify live

```zsh
curl -s https://unsurfaced-intelligence.com/justiceinresidence/ | grep -o "<title>[^<]*"
```

Expect `<title>In Community: Justice In Residence × Catalyst for Change`. If it prints the homepage title, step 1 was
missed: fix the command, then push any commit or retry the deployment.

Then open the page on a phone, tap a photo, swipe, and run the URL through LinkedIn Post Inspector.

## Undo

Before committing: `python3 "$SRC" --revert`. After pushing: revert the commit in GitHub Desktop and push.
