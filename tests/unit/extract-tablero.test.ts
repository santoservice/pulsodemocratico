import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { extractTablero } from '../../scripts/extract-tablero';

const entry = (text: string, compressed = true) => ({
  mime: 'application/javascript',
  compressed,
  data: (compressed ? gzipSync(Buffer.from(text)) : Buffer.from(text)).toString('base64'),
});

const html = (manifest: object) =>
  `<html><script type="__bundler/manifest">${JSON.stringify(manifest)}</script></html>`;

describe('extractTablero', () => {
  it('encuentra y decodifica window.TABLERO', () => {
    const out = extractTablero(
      html({
        a: entry('console.log(1)'),
        b: entry('window.TABLERO = {"meta":{"n_total":2008}};\n'),
        c: entry('otra cosa', false),
      }),
    );
    expect(out).toEqual({ meta: { n_total: 2008 } });
  });

  it('errores claros', () => {
    expect(() => extractTablero('<html></html>')).toThrow(/manifest/);
    expect(() => extractTablero(html({ a: entry('x = 1') }))).toThrow(/window\.TABLERO/);
  });
});
