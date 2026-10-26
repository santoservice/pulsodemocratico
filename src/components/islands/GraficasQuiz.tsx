import { useEffect, useState } from 'react';
import { entero, pct } from '../../lib/format';
import {
  etiquetaRespuesta,
  pctGrupoDesdeDistribucion,
  pctMismaRespuesta,
  rangoPregunta,
  valoresPregunta,
  type PreguntaQuiz,
} from '../../lib/quiz';

/**
 * Gráficas de «Tu resultado» en el quiz, una por tipo (`pregunta.grafica`), con el personaje
 * «Tú» de la escena del quiz. HTML/SVG con tokens del tema; animaciones con transiciones CSS
 * que respetan `prefers-reduced-motion`.
 */

const sinMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** false en el primer pintado; true tras `retraso` ms (o enseguida sin movimiento). */
function useListo(retraso = 0) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (sinMovimiento()) return setListo(true);
    let raf = 0;
    const t = window.setTimeout(() => {
      raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => setListo(true))));
    }, retraso);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [retraso]);
  return listo;
}

const curva = 'cubic-bezier(0.22, 1, 0.36, 1)';
const rebote = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/* ------------------------------------------------------------- personaje */

/** Persona de pie (como en la escena del quiz) o corriendo. */
export function Figura({ pose = 'pie', className = '' }: { pose?: 'pie' | 'corre'; className?: string }) {
  return (
    <svg viewBox="0 0 100 140" aria-hidden="true" className={`block h-auto ${className}`}>
      {pose === 'pie' ? (
        <g className="fill-current">
          <circle cx="50" cy="15" r="11" />
          <path d="M38 30H62A14 14 0 0 1 76 44V75A4 4 0 0 1 68 75V48H65.5V127A7 7 0 0 1 51.5 127V88H48.5V127A7 7 0 0 1 34.5 127V48H32V75A4 4 0 0 1 24 75V44A14 14 0 0 1 38 30Z" />
        </g>
      ) : (
        <>
          <circle cx="64" cy="17" r="11" className="fill-current" />
          <g className="fill-none stroke-current" strokeLinecap="round" strokeLinejoin="round">
            <path d="M57 37 48 74" strokeWidth="17" />
            <path d="M56 40 67 54 79 46M51 40 38 48 31 61" strokeWidth="8" />
            <path d="M49 76 65 94 63 121M47 76 35 99 15 96" strokeWidth="10" />
          </g>
        </>
      )}
    </svg>
  );
}

function ChipTu() {
  return (
    <span className="rounded-full bg-tu px-2 py-0.5 text-xs leading-none font-bold text-on-tu shadow-sm">
      Tú
    </span>
  );
}

/* --------------------------------------------------------------- columnas */

/** Una columna por respuesta (alto relativo a la mayor). «Tú» cae sobre la tuya. */
export function Columnas({ pregunta: p, valor }: { pregunta: PreguntaQuiz; valor: number }) {
  const datos = valoresPregunta(p).map((v) => ({ v, pct: pctMismaRespuesta(p, v) }));
  const max = Math.max(...datos.map((d) => d.pct), 1);
  const crece = useListo();
  const cae = useListo(650);
  const ALTO = 95;
  return (
    <div className="flex items-end gap-3 sm:gap-5" style={{ height: ALTO + 105 }}>
      {datos.map((d) => {
        const tuya = d.v === valor;
        return (
          <div key={d.v} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            {tuya && (
              <div
                className="mb-1 flex flex-col items-center gap-1 text-tu"
                style={{
                  opacity: cae ? 1 : 0,
                  filter: cae ? 'none' : 'blur(4px)',
                  transform: cae ? 'none' : 'translateY(-48px)',
                  transition: `opacity 500ms ease-out, filter 500ms ease-out, transform 700ms ${rebote}`,
                }}
              >
                <ChipTu />
                <Figura className="w-7" />
              </div>
            )}
            <div
              className={`w-full max-w-20 ${tuya ? 'bg-chart-accent' : 'bg-chart-muted/60'}`}
              style={{
                height: crece ? Math.max(4, (d.pct / max) * ALTO) : 4,
                transition: `height 600ms ${curva}`,
              }}
            />
            <p className="mt-2 text-center text-sm leading-tight">
              <b className={`block tabular-nums ${tuya ? 'text-brand' : 'text-ink'}`}>{pct(d.pct)}</b>
              <span className={`text-xs ${tuya ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                {etiquetaRespuesta(p, d.v)}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ barra */

/** Barra partida en tramos (ancho = % que dio esa respuesta). «Tú» corre hasta tu tramo. */
export function BarraTramos({ pregunta: p, valor }: { pregunta: PreguntaQuiz; valor: number }) {
  const tramos = valoresPregunta(p).map((v) => ({ v, pct: pctMismaRespuesta(p, v) }));
  let acumulado = 0;
  const conPos = tramos.map((t) => {
    const desde = acumulado;
    acumulado += t.pct;
    return { ...t, desde, centro: desde + t.pct / 2 };
  });
  const tuyo = conPos.find((t) => t.v === valor)!;
  const corre = useListo(300);
  const [llego, setLlego] = useState(false);
  useEffect(() => {
    if (!corre) return;
    const t = window.setTimeout(() => setLlego(true), sinMovimiento() ? 0 : 1300);
    return () => window.clearTimeout(t);
  }, [corre]);
  const [lo, hi] = rangoPregunta(p);
  return (
    <div className="pt-14 pb-1">
      <div className="relative">
        {/* Tú: corre desde el inicio hasta el centro de su tramo. */}
        <div
          className="absolute bottom-full mb-1 flex -translate-x-1/2 flex-col items-center gap-1 text-tu"
          style={{
            left: `${corre ? tuyo.centro : 0}%`,
            transition: `left 1300ms ${curva}`,
          }}
        >
          <ChipTu />
          <Figura pose={llego ? 'pie' : 'corre'} className="w-9" />
        </div>
        <div className="flex h-7 w-full gap-0.5">
          {conPos.map((t, k) => (
            <div
              key={t.v}
              className={`h-full transition-colors duration-500 ${
                t.v === valor && llego
                  ? 'bg-chart-accent'
                  : k % 2 === 0
                    ? 'bg-chart-muted/70'
                    : 'bg-chart-muted/40'
              }`}
              style={{ width: `${t.pct}%` }}
            />
          ))}
        </div>
        {/* Etiquetas solo en los tramos con espacio (≥ 8 %). */}
        <div className="relative mt-2 h-9 text-center text-xs leading-tight">
          {conPos
            .filter((t) => t.pct >= 8)
            .map((t) => (
              <p
                key={t.v}
                className="absolute -translate-x-1/2"
                style={{ left: `${t.centro}%` }}
              >
                <b className={`block tabular-nums ${t.v === valor ? 'text-brand' : 'text-ink'}`}>
                  {pct(t.pct)}
                </b>
                <span className="text-ink-muted">en el {t.v}</span>
              </p>
            ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-4 text-xs text-ink-muted">
        <span>
          {lo} = {p.etiquetasExtremos?.[0]}
        </span>
        <span className="text-right">
          {hi} = {p.etiquetasExtremos?.[1]}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- personas */

/** Personita simple (cabeza + cuerpo) para la cuadrícula de 100. */
function Persona() {
  return (
    <svg viewBox="0 0 20 24" aria-hidden="true" className="block h-auto w-full fill-current">
      <circle cx="10" cy="5" r="4.5" />
      <path d="M3 24v-6.5a7 7 0 0 1 14 0V24Z" />
    </svg>
  );
}

/** 100 personitas: las del grupo en color; «Tú» se marca en el tuyo. */
export function Personas({
  pregunta: p,
  valor,
  valores,
  si,
  no,
}: {
  pregunta: PreguntaQuiz;
  valor: number;
  valores: readonly number[];
  si: string;
  no: string;
}) {
  const nSi = Math.round(pctGrupoDesdeDistribucion(p, valores));
  const dentro = valores.includes(valor);
  const tuIndice = dentro ? nSi - 1 : nSi;
  const aparece = useListo();
  const marca = useListo(1100);
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="grid w-full max-w-32 shrink-0 grid-cols-10 gap-x-1 gap-y-1">
        {Array.from({ length: 100 }, (_, k) => {
          const enSi = k < nSi;
          const tu = k === tuIndice;
          return (
            <div
              key={k}
              className={`relative ${tu && marca ? 'text-tu' : enSi ? 'text-chart-accent' : 'text-chart-muted/45'}`}
              style={{
                opacity: aparece ? 1 : 0,
                transform: tu && marca ? 'scale(1.5)' : 'none',
                transition: `opacity 300ms ease-out ${k * 6}ms, transform 400ms ${rebote}, color 300ms`,
              }}
            >
              {tu && (
                <span
                  className="absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2"
                  style={{ opacity: marca ? 1 : 0, transition: 'opacity 300ms' }}
                >
                  <ChipTu />
                </span>
              )}
              <Persona />
            </div>
          );
        })}
      </div>
      <ul className="flex flex-col gap-2 text-sm leading-snug">
        <li className="flex items-start gap-2">
          <i className="mt-1 inline-block h-3 w-3 shrink-0 bg-chart-accent" />
          <span className={dentro ? 'font-semibold text-ink' : 'text-ink-muted'}>
            <b className="tabular-nums">{entero(nSi)}</b> {si}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <i className="mt-1 inline-block h-3 w-3 shrink-0 bg-chart-muted/45" />
          <span className={dentro ? 'text-ink-muted' : 'font-semibold text-ink'}>
            <b className="tabular-nums">{entero(100 - nSi)}</b> {no}
          </span>
        </li>
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------- pastel */

/**
 * Pastel de dos partes (dentro / fuera del grupo). Tu parte en color y algo separada del
 * centro; «Tú» aparece dentro de ella.
 */
export function Pastel({
  pregunta: p,
  valor,
  si,
  no,
}: {
  pregunta: PreguntaQuiz;
  valor: number;
  si: string;
  no: string;
}) {
  const c = p.comparacion;
  const valores = c.modo === 'porcentaje' ? c.valoresGrupo : [];
  const pSi = pctGrupoDesdeDistribucion(p, valores);
  const dentro = valores.includes(valor);
  const dibuja = useListo();
  const aparece = useListo(1000);
  // Pastel con un círculo de trazo grueso (r = 30, trazo 60 → radio 60): el trazo dibuja cada parte.
  const R = 30;
  const L = 2 * Math.PI * R;
  const partes = [
    { desde: 0, cuanto: pSi, tuya: dentro },
    { desde: pSi, cuanto: 100 - pSi, tuya: !dentro },
  ];
  const tuya = partes.find((x) => x.tuya)!;
  // Ángulo del centro de tu parte (0° arriba, sentido horario) y dirección hacia afuera.
  const ang = ((tuya.desde + tuya.cuanto / 2) / 100) * 2 * Math.PI;
  const dir = { x: Math.sin(ang), y: -Math.cos(ang) };
  const separa = aparece ? 4 : 0;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
      <div className="relative w-36 shrink-0">
        <svg viewBox="-6 -6 132 132" aria-hidden="true" className="block h-auto w-full">
          {partes.map((x) => (
            <g
              key={x.desde}
              style={{
                transform: x.tuya ? `translate(${dir.x * separa}px, ${dir.y * separa}px)` : 'none',
                transition: `transform 500ms ${rebote}`,
              }}
            >
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                strokeWidth={2 * R}
                transform="rotate(-90 60 60)"
                className={x.tuya ? 'stroke-chart-accent' : 'stroke-chart-muted/50'}
                strokeDasharray={`${dibuja ? (x.cuanto / 100) * L : 0} ${L}`}
                strokeDashoffset={-(x.desde / 100) * L}
                style={{ transition: `stroke-dasharray 900ms ${curva}` }}
              />
            </g>
          ))}
        </svg>
        {/* Tú: en el centro de tu parte (a 55 % del radio), en contraste sobre el color. */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-on-accent"
          style={{
            left: `${50 + dir.x * (27.5 + separa / 1.32)}%`,
            top: `${50 + dir.y * (27.5 + separa / 1.32)}%`,
            opacity: aparece ? 1 : 0,
            scale: aparece ? '1' : '0.5',
            transition: `opacity 400ms ease-out, scale 500ms ${rebote}`,
          }}
        >
          <ChipTu />
          <Figura className="w-6" />
        </div>
      </div>
      <ul className="flex flex-col gap-3 text-sm leading-snug">
        {[
          { cuanto: pSi, texto: si, tuyo: dentro },
          { cuanto: 100 - pSi, texto: no, tuyo: !dentro },
        ].map((x) => (
          <li key={x.texto} className="flex items-baseline gap-3">
            <b className={`w-14 shrink-0 text-xl tabular-nums ${x.tuyo ? 'text-brand' : 'text-ink-muted'}`}>
              {pct(x.cuanto)}
            </b>
            <span className={x.tuyo ? 'font-semibold text-ink' : 'text-ink-muted'}>
              {x.texto[0]!.toUpperCase() + x.texto.slice(1)}
              {x.tuyo && <span className="ml-2 text-grana">← Tú</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
/** Gráfica que corresponde a la pregunta. */
export function GraficaResultado({ pregunta: p, valor }: { pregunta: PreguntaQuiz; valor: number }) {
  const g = p.grafica;
  if (g.tipo === 'columnas') return <Columnas pregunta={p} valor={valor} />;
  if (g.tipo === 'barra') return <BarraTramos pregunta={p} valor={valor} />;
  if (g.tipo === 'personas')
    return <Personas pregunta={p} valor={valor} valores={g.valores} si={g.si} no={g.no} />;
  return <Pastel pregunta={p} valor={valor} si={g.si} no={g.no} />;
}
