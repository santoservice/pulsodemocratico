/**
 * Extrae el objeto `window.TABLERO` del HTML autocontenido del tablero CNEP
 * y lo escribe como JSON formateado en `src/data/tablero.json`.
 *
 * Uso:
 *   pnpm data:extract "<ruta>/Tablero 2.0 CNEP Colombia 2026 (autocontenido).html" [salida.json]
 *
 * (equivale a `node --experimental-strip-types scripts/extract-tablero.ts <html> [salida]`,
 * Node ≥ 22.6; no requiere dependencias).
 *
 * Cómo funciona:
 *   1. Busca `<script type="__bundler/manifest">…</script>` en el HTML. Su contenido es un JSON
 *      `{ [uuid]: { mime, compressed, data } }` donde `data` va en base64 (y gzip si
 *      `compressed: true`).
 *   2. Decodifica cada entrada y se queda con la que empieza por `window.TABLERO =`.
 *   3. Toma el literal que sigue al `=`, lo valida como JSON y lo escribe indentado.
 *
 * Después de extraer, `pnpm test` y `pnpm build` validan la forma con el esquema Zod
 * (`src/lib/schema.ts`): si los investigadores cambian la estructura, el build falla.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';

interface ManifestEntry {
  mime?: string;
  compressed?: boolean;
  data: string;
}

const PREFIX = /^\s*window\.TABLERO\s*=\s*/;

export function decodeEntry(entry: ManifestEntry): string {
  const buf = Buffer.from(entry.data, 'base64');
  return (entry.compressed ? gunzipSync(buf) : buf).toString('utf8');
}

export function extractTablero(html: string): unknown {
  const m = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No se encontró <script type="__bundler/manifest"> en el HTML.');
  const manifest = JSON.parse(m[1]!) as Record<string, ManifestEntry>;

  for (const entry of Object.values(manifest)) {
    let text: string;
    try {
      text = decodeEntry(entry);
    } catch {
      continue; // entrada binaria o no decodificable: no es la que buscamos
    }
    if (!PREFIX.test(text)) continue;
    const literal = text.replace(PREFIX, '').trim().replace(/;\s*$/, '');
    try {
      return JSON.parse(literal);
    } catch (err) {
      throw new Error(
        `Se encontró window.TABLERO pero su contenido no es JSON válido: ${(err as Error).message}`,
      );
    }
  }
  throw new Error('Ninguna entrada del manifest empieza por "window.TABLERO =".');
}

function main(argv: string[]): void {
  const [input, output = 'src/data/tablero.json'] = argv;
  if (!input) {
    console.error('Uso: pnpm data:extract <tablero-autocontenido.html> [salida.json]');
    process.exit(1);
  }
  const tablero = extractTablero(readFileSync(resolve(input), 'utf8'));
  const out = resolve(output);
  writeFileSync(out, JSON.stringify(tablero, null, 2) + '\n', 'utf8');
  console.log(`TABLERO escrito en ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2));
}
