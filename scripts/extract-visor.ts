/**
 * Extrae los datos del "Visor de hallazgos CNEP Colombia 2026" (HTML que envían los
 * investigadores) y los escribe como JSON formateado en `src/data/visor.json`.
 *
 * Uso:
 *   pnpm data:visor "<ruta>/Visor hallazgos CNEP Colombia 2026.html" [salida.json]
 *
 * (equivale a `node --experimental-strip-types scripts/extract-visor.ts <html> [salida]`,
 * Node ≥ 22.6; no requiere dependencias).
 *
 * Cómo funciona: el visor trae todos sus datos en `<script id="datos" type="application/json">`.
 * Se toma ese bloque, se valida como JSON y se escribe indentado. Si los investigadores cambian
 * la estructura, `pnpm check` / `pnpm build` fallan por los tipos de `src/lib/visor.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function extractVisor(html: string): unknown {
  const m = html.match(/<script[^>]*\bid="datos"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No se encontró <script id="datos"> en el HTML del visor.');
  try {
    return JSON.parse(m[1]!);
  } catch (err) {
    throw new Error(`El bloque de datos del visor no es JSON válido: ${(err as Error).message}`);
  }
}

function main(argv: string[]): void {
  const [input, output = 'src/data/visor.json'] = argv;
  if (!input) {
    console.error('Uso: pnpm data:visor <visor-hallazgos.html> [salida.json]');
    process.exit(1);
  }
  const datos = extractVisor(readFileSync(resolve(input), 'utf8'));
  const out = resolve(output);
  writeFileSync(out, JSON.stringify(datos, null, 2) + '\n', 'utf8');
  console.log(`Datos del visor escritos en ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2));
}
