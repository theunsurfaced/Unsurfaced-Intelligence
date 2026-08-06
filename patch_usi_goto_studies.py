#!/usr/bin/env python3
"""
SEAM:STUDY_INVITE_ROUTE -- installs window.usiAuthToken and window.usiGoToStudies
into intelligence/index.html.

Built against the real monolith:
  token ladder    window._authHeader() (the app's own helper, a top-level
                  function declaration and therefore a window global), then the
                  persisted sb-*-auth-token session, then null
  routing ladder  window.openStudyBoard() (the exact function behind the
                  "Browse open studies" button inside MINE), then
                  window.enterSpace('mine') (the hub door, which also carries
                  SEAM:DOOR_GATE for signed-out visitors), then a real click on
                  .door-mine. No hash fallback: this app does not hash-route.

Run from repo root:
  python3 patch_usi_goto_studies.py            # recon only
  python3 patch_usi_goto_studies.py --apply
"""

import io, os, sys

TARGET = "intelligence/index.html"
SEAM = "SEAM:STUDY_INVITE_ROUTE"
INVITE_MARK = "<!-- SEAM:STUDY_INVITE --"

BLOCK = r'''<!-- SEAM:STUDY_INVITE_ROUTE -- token getter and MINE routing for the invite -->
<script id="usiInviteRoute">
(function () {
  'use strict';

  var SB_REF = 'uxbhafkqungklmnrfdhp';

  /* ---------------------------------------------------------------- token */
  function decodeStored(raw) {
    if (!raw) return null;
    if (raw.slice(0, 7) === 'base64-') {
      try {
        var bin = atob(raw.slice(7));
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
        raw = new TextDecoder('utf-8').decode(bytes);
      } catch (e) { return null; }
    }
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function fromStorage() {
    try {
      var keys = ['sb-' + SB_REF + '-auth-token'];
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.slice(0, 3) === 'sb-' && k.indexOf('-auth-token') > 0 && keys.indexOf(k) < 0) {
          keys.push(k);
        }
      }
      for (var j = 0; j < keys.length; j++) {
        var v = decodeStored(window.localStorage.getItem(keys[j]));
        if (!v) continue;
        var t = v.access_token
             || (v.currentSession && v.currentSession.access_token)
             || (Array.isArray(v) && v[0]);
        if (t && typeof t === 'string') return t;
      }
    } catch (e) { /* storage unavailable */ }
    return null;
  }

  window.usiAuthToken = function () {
    if (typeof window._authHeader === 'function') {
      return Promise.resolve()
        .then(window._authHeader)
        .then(function (h) {
          var a = h && (h.Authorization || h.authorization);
          if (a && a.slice(0, 7) === 'Bearer ') return a.slice(7);
          return fromStorage();
        }, fromStorage);
    }
    return Promise.resolve(fromStorage());
  };

  /* --------------------------------------------------------------- routing */
  window.usiGoToStudies = function () {
    if (typeof window.openStudyBoard === 'function') {
      try { window.openStudyBoard(); return true; } catch (e) { /* fall through */ }
    }
    if (typeof window.enterSpace === 'function') {
      try { window.enterSpace('mine'); return true; } catch (e) { /* fall through */ }
    }
    var el = document.querySelector('.door-mine');
    if (el && typeof el.click === 'function') {
      try { el.click(); return true; } catch (e) { /* fall through */ }
    }
    return false;
  };
})();
</script>
<!-- /SEAM:STUDY_INVITE_ROUTE -->
'''


def main():
    apply = "--apply" in sys.argv

    if not os.path.exists(TARGET):
        print("FAIL target missing:", TARGET)
        print("     run this from the repo root")
        return 1

    s = io.open(TARGET, "r", encoding="utf-8").read()
    print("RECON chars (utf-8 decoded):", len(s))

    if SEAM in s:
        print("FAIL seam already present, nothing to do")
        return 1

    # probe for DEFINITIONS, not mentions: the invite block legitimately
    # references both globals behind typeof guards
    for sym in ('window.usiAuthToken = function',
                'window.usiGoToStudies = function',
                'id="usiInviteRoute"'):
        c = s.count(sym)
        print("RECON symbol '%s' existing occurrences: %d" % (sym, c))
        if c:
            print("FAIL symbol collision, rename before injecting")
            return 1

    # confirm the rungs this shim relies on actually exist in this build
    for probe in ("_authHeader", "enterSpace", "door-mine"):
        print("RECON app symbol '%s' occurrences: %d" % (probe, s.count(probe)))

    n_invite = s.count(INVITE_MARK)
    n_body = s.count("</body>")
    print("RECON invite marker occurrences: %d" % n_invite)
    print("RECON </body> occurrences: %d (templates in JS strings expected; rindex targets the real close)" % n_body)

    if n_invite == 1:
        at = s.index(INVITE_MARK)
        where = "before the invite block"
    elif n_invite == 0 and n_body >= 1:
        at = s.rindex("</body>")
        where = "before the final </body> (invite not installed yet)"
    else:
        print("FAIL ambiguous anchor. invite markers=%d, body tags=%d" % (n_invite, n_body))
        return 1

    print("RECON cut index: %d, %s" % (at, where))

    bad = [g for g in ["\u201c", "\u201d", "\u2018", "\u2019",
                       "\u2014", "\u2013", "\u2026", "\u00a0"] if g in BLOCK]
    if bad:
        print("FAIL smart-glyph scan on payload:", bad)
        return 1
    print("PASS smart-glyph scan on payload")

    if not apply:
        print("")
        print("DRY RUN. Nothing written. Rerun with --apply to cut.")
        return 0

    out = s[:at] + BLOCK + "\n" + s[at:]
    io.open(TARGET, "w", encoding="utf-8").write(out)

    print("PASS injected %d bytes" % len(BLOCK))
    print("PASS new size: %d" % len(out))
    print("NEXT python3 patch_study_invite.py (if not yet applied)")
    print("NEXT register both seams in seams.json, same commit")
    print("NEXT python3 tools/ritual_gate.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
