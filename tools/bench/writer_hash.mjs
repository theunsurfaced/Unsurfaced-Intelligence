/**
 * tools/bench/writer_hash.mjs  --  SEAM:BENCH: the writer's hash. The same slices tools/ritual_gate.py hashes (writer_hash there),
 * so a bench run can be tied to the writer it graded. Usage: node tools/bench/writer_hash.mjs  (prints the hash)
 */
import fs from 'fs';
import crypto from 'crypto';
export const WRITER_SLICES = [
  ['const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = '],
  ['const EXC_MOVE_LAW = ', 'function excReportPrompt('],
  ['function excReportPrompt(', 'function excAnchors('],
  ['const EXC_NUMBER_LAW = ', null],
  ['const EXC_VOICE_SYS = ', null],
  ['const EXC_TIME_LAW = ', null],
  ['function excDoorPrompt(', '// The compiled text becomes'],
  ["    const tight = ' ROOM LAW", '    const passes = [];']
];
export function nextDecl(src, from) {
  const re = /\n(?=(?:const |let |function |async function |\/\*|\/\/ ))/g; re.lastIndex = from;
  const m = re.exec(src); return m ? m.index : src.length;
}
export function writerHash(src) {
  const parts = [];
  for (const [a, b] of WRITER_SLICES) {
    const i = src.indexOf(a); if (i < 0) throw new Error('writer slice missing: ' + a);
    const j = b ? src.indexOf(b, i + 1) : nextDecl(src, i + a.length);
    if (j < 0) throw new Error('writer slice end missing: ' + b);
    parts.push(src.slice(i, j));
  }
  return crypto.createHash('sha256').update(parts.join('\n')).digest('hex');
}
if (process.argv[1] && /writer_hash\.mjs$/.test(process.argv[1])) {
  console.log(writerHash(fs.readFileSync('worker/src/index.js', 'utf-8')));
}
