"""jsscan.py  --  shared by patch_recovery.py and the ritual gate's voice check.
A tokenizer-lite for the worker: yields every string literal (quote kind,
start offset, end offset, line) while skipping comments and regex literals.
Template literals are one span including their ${} holes."""
import re

_REGEX_PREV = set("(,=:[!&|?{};+")

def string_spans(src):
    i, n, line = 0, len(src), 1
    while i < n:
        c = src[i]
        d = src[i + 1] if i + 1 < n else ''
        if c == '\n':
            line += 1; i += 1; continue
        if c == '/' and d == '/':
            while i < n and src[i] != '\n': i += 1
            continue
        if c == '/' and d == '*':
            i += 2
            while i < n and not (src[i] == '*' and i + 1 < n and src[i + 1] == '/'):
                if src[i] == '\n': line += 1
                i += 1
            i += 2; continue
        if c in "\"'`":
            q, l0, j, depth = c, line, i + 1, 0
            while j < n:
                ch = src[j]
                if ch == '\\': j += 2; continue
                if ch == '\n': line += 1
                if q == '`' and ch == '$' and j + 1 < n and src[j + 1] == '{': depth += 1; j += 2; continue
                if q == '`' and depth and ch == '}': depth -= 1; j += 1; continue
                if ch == q and not depth: break
                j += 1
            yield (q, i, j + 1, l0)
            i = j + 1; continue
        if c == '/':
            k = i - 1
            while k >= 0 and src[k] in ' \t\r\n': k -= 1
            if k < 0 or src[k] in _REGEX_PREV or src[max(0, k - 5):k + 1] == 'return':
                j, cls = i + 1, False
                while j < n and src[j] != '\n':
                    if src[j] == '\\': j += 2; continue
                    if src[j] == '[': cls = True
                    elif src[j] == ']': cls = False
                    elif src[j] == '/' and not cls: break
                    j += 1
                if j < n and src[j] == '/':
                    i = j + 1; continue
        i += 1

DASH = re.compile(r"—|\\u2014|&mdash;")
# The one sanctioned dash: pvDecode turns an outside article's &mdash; entity
# into the glyph. That is their text, decoded faithfully, never our voice.
ALLOW = ["replace(/&mdash;/g, '\\u2014')"]

def dash_strings(src):
    out = []
    for q, a, b, line in string_spans(src):
        lit = src[a:b]
        if not DASH.search(lit): continue
        if any(src[max(0, a - 40):b + 1].endswith(x) or x in src[max(0, a - 40):b + 1] for x in ALLOW) and lit == "'\\u2014'":
            continue
        out.append((a, b, line, lit))
    return out
