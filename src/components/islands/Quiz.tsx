import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { decimal, entero, pct } from '../../lib/format';
import {
  DE_LOS_ENCUESTADOS,
  PROMEDIO_ENCUESTADOS,
  evaluarRespuesta,
  etiquetaRespuesta,
  posicionEnEscala,
  rangoPregunta,
  resumenFinal,
  valoresPregunta,
  type ComparacionPorcentaje,
  type Evaluacion,
  type PreguntaQuiz,
} from '../../lib/quiz';

/**
 * Quiz «¿Dónde te ubicas frente al resto del país?» (PLAN.md §4.1, §6). Isla `client:visible`.
 *
 * Flujo (borrador HTML del cliente): dos paneles. A la izquierda, una pregunta por pantalla
 * (barra de progreso, Cerrar · Anterior · Siguiente/Terminar); a la derecha, «Tu resultado»
 * se actualiza en cuanto se elige una respuesta. Al terminar: «¡Listo!» + «Tu resultado final»
 * con las 4 comparaciones. Nada se guarda ni se envía.
 *
 * Sin librerías de gráficas: las mini-visualizaciones son HTML/CSS con tokens del tema.
 */
interface Props {
  preguntas: readonly PreguntaQuiz[];
}

type Fase = 'preguntas' | 'final';
type Foco = 'pregunta' | 'final' | null;

const temaHref = (slug: string) => `/resultados/${slug}`;
const btnBase =
  'inline-flex min-h-11 items-center justify-center gap-2 border px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
const btnPrimario = `${btnBase} border-accent bg-accent text-on-accent hover:enabled:bg-accent-hover`;
const btnContorno = `${btnBase} border-ink bg-surface text-ink hover:bg-surface-muted`;
const btnTexto =
  'inline-flex min-h-11 items-center gap-1 px-1 font-medium text-ink underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline disabled:opacity-60';

export default function Quiz({ preguntas }: Props) {
  const total = preguntas.length;
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => preguntas.map(() => null));
  const [fase, setFase] = useState<Fase>('preguntas');
  const [foco, setFoco] = useState<Foco>(null);
  const preguntaRef = useRef<HTMLHeadingElement>(null);
  const finalRef = useRef<HTMLHeadingElement>(null);
  const uid = useId();

  // Mueve el foco tras cambiar de paso (no en la carga inicial).
  useEffect(() => {
    if (foco === 'pregunta') preguntaRef.current?.focus();
    if (foco === 'final') finalRef.current?.focus();
    if (foco) setFoco(null);
  }, [foco]);

  const p = preguntas[paso]!;
  const valor = respuestas[paso] ?? null;
  const evaluacion = valor == null ? null : evaluarRespuesta(p, valor);
  const ultima = paso === total - 1;

  const responder = (v: number) => setRespuestas((rs) => rs.map((r, k) => (k === paso ? v : r)));
  const ir = (k: number) => {
    setPaso(k);
    setFoco('pregunta');
  };
  const reiniciar = () => {
    setRespuestas(preguntas.map(() => null));
    setPaso(0);
    setFase('preguntas');
    setFoco('pregunta');
  };
  const terminar = () => {
    setFase('final');
    setFoco('final');
  };
  const revisar = () => {
    setFase('preguntas');
    ir(0);
  };

  const qId = `${uid}-q`;
  const resumen =
    fase === 'final'
      ? resumenFinal(preguntas, Object.fromEntries(preguntas.map((q, k) => [q.id, respuestas[k]])))
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ---------------------------------------------------------- Paso 1 */}
      <div className="flex min-w-0 flex-col border border-border bg-surface p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
          <p>
            Pregunta {fase === 'final' ? total : paso + 1} de {total}
          </p>
          <button type="button" className={btnTexto} onClick={reiniciar}>
            <span aria-hidden="true">✕</span> Cerrar
          </button>
        </div>
        <ol className="mt-2 mb-5 flex gap-1.5" aria-hidden="true">
          {preguntas.map((q, k) => (
            <li
              key={q.id}
              className={`h-1.5 flex-1 ${fase === 'final' || k <= paso ? 'bg-accent' : 'bg-surface-sunken'}`}
            />
          ))}
        </ol>

        {fase === 'preguntas' ? (
          <>
            <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
              {p.temaTitulo}
            </p>
            <h3
              id={qId}
              ref={preguntaRef}
              tabIndex={-1}
              className="mt-1 text-xl leading-snug font-semibold text-ink focus:outline-none focus-visible:outline-2"
            >
              {p.texto}
            </h3>
            <Opciones key={p.id} pregunta={p} valor={valor} labelledBy={qId} onChange={responder} />
            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
              <button
                type="button"
                className={btnTexto}
                onClick={() => ir(paso - 1)}
                disabled={paso === 0}
              >
                <span aria-hidden="true">←</span> Anterior
              </button>
              <button
                type="button"
                className={btnPrimario}
                disabled={valor == null}
                onClick={() => (ultima ? terminar() : ir(paso + 1))}
              >
                {ultima ? 'Terminar' : 'Siguiente'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3
              ref={finalRef}
              tabIndex={-1}
              className="text-2xl leading-snug font-bold text-ink focus:outline-none focus-visible:outline-2"
            >
              ¡Listo! Respondiste las {total} preguntas.
            </h3>
            <p className="mt-3 leading-relaxed text-ink-muted">
              Mira en el resultado final cómo te comparas con el {PROMEDIO_ENCUESTADOS} en cada
              tema.
            </p>
            <div className="mt-auto pt-6">
              <button type="button" className={btnTexto} onClick={revisar}>
                <span aria-hidden="true">←</span> Revisar mis respuestas
              </button>
            </div>
          </>
        )}
      </div>

      {/* ---------------------------------------------------------- Paso 2 */}
      <div className="flex min-w-0 flex-col border border-border bg-surface p-4 sm:p-6">
        {fase === 'preguntas' ? (
          <>
            <h3 className="text-xl font-bold text-ink">Tu resultado</h3>
            <p className="mt-1 text-sm text-ink-muted">{p.temaTitulo}</p>
            <div className="mt-6">
              {p.comparacion.modo === 'promedio' ? (
                <EscalaComparada pregunta={p} valor={valor} promedio={p.comparacion.valor} />
              ) : (
                <BarraGrupo
                  c={p.comparacion}
                  dentro={evaluacion?.dentroDelGrupo ?? null}
                  etiqueta={evaluacion?.etiqueta}
                />
              )}
            </div>
            <div aria-live="polite" className="mt-5 min-h-16 leading-relaxed">
              {evaluacion ? (
                <>
                  <p className="font-semibold text-ink">{evaluacion.texto}</p>
                  <p className="mt-1 text-sm text-ink-muted">{evaluacion.textoMismaRespuesta}</p>
                </>
              ) : (
                <p className="text-ink-muted">Elige una respuesta para ver dónde te ubicas.</p>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {p.ronda} · {entero(p.n)} personas encuestadas respondieron esta pregunta.
            </p>
            <Acciones onRepetir={reiniciar} href={temaHref(p.tema)}>
              Ver resultados del tema
            </Acciones>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-ink">Tu resultado final</h3>
            <ul className="mt-4 divide-y divide-border">
              {resumen!.evaluaciones.map((e) => {
                const q = preguntas.find((x) => x.id === e.preguntaId)!;
                return <FilaFinal key={q.id} pregunta={q} e={e} />;
              })}
            </ul>
            <p
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted"
              aria-hidden="true"
            >
              <span className="inline-flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-full bg-chart-accent" />
                Tú
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="inline-block h-3 w-0.5 bg-chart-ink" />
                Promedio de los encuestados
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-4 bg-chart-accent" />% de los encuestados en el
                grupo
              </span>
            </p>
            {resumen!.texto && <p className="mt-4 leading-relaxed text-ink">{resumen!.texto}</p>}
            <Acciones onRepetir={reiniciar} href="/resultados">
              Ver todos los resultados
            </Acciones>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- opciones */

function Opciones({
  pregunta: p,
  valor,
  labelledBy,
  onChange,
}: {
  pregunta: PreguntaQuiz;
  valor: number | null;
  labelledBy: string;
  onChange: (v: number) => void;
}) {
  const valores = valoresPregunta(p);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activo = valor == null ? 0 : Math.max(0, valores.indexOf(valor));
  const esOpciones = p.tipo === 'opciones';

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, k: number) => {
    let n: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (k + 1) % valores.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      n = (k - 1 + valores.length) % valores.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = valores.length - 1;
    if (n == null) return;
    e.preventDefault();
    onChange(valores[n]!);
    refs.current[n]?.focus();
  };

  const extremos = p.etiquetasExtremos;
  return (
    <div className="mt-5">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className={
          esOpciones
            ? 'grid grid-cols-2 gap-2'
            : valores.length > 6
              ? // 0–10 en pantallas < 400px: dos filas para que cada botón sea tocable (~40px).
                'grid grid-cols-6 gap-1 min-[400px]:flex sm:gap-1.5'
              : 'flex gap-1 sm:gap-1.5'
        }
      >
        {valores.map((v, k) => {
          const sel = v === valor;
          const etiqueta = etiquetaRespuesta(p, v);
          const extremo =
            extremos && !esOpciones && (k === 0 || k === valores.length - 1)
              ? extremos[k === 0 ? 0 : 1]
              : null;
          return (
            <button
              key={v}
              ref={(el) => {
                refs.current[k] = el;
              }}
              type="button"
              role="radio"
              aria-checked={sel}
              aria-label={extremo ? `${etiqueta} (${extremo})` : undefined}
              tabIndex={k === activo ? 0 : -1}
              onClick={() => onChange(v)}
              onKeyDown={(e) => onKeyDown(e, k)}
              className={`border text-center font-semibold tabular-nums transition-colors ${
                esOpciones
                  ? 'min-h-12 px-2 py-2 text-sm leading-tight'
                  : 'h-11 min-w-0 flex-1 px-0 text-sm sm:text-base'
              } ${
                sel
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-border-strong bg-surface text-ink hover:border-ink hover:bg-surface-muted'
              }`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>
      {extremos && !esOpciones && (
        <div className="mt-2 flex justify-between gap-4 text-xs text-ink-muted" aria-hidden="true">
          <span>
            {rangoPregunta(p)[0]} = {extremos[0]}
          </span>
          <span className="text-right">
            {rangoPregunta(p)[1]} = {extremos[1]}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- visualizaciones */

/** Alinea una etiqueta posicionada para que no se salga por los bordes. */
const anclaje = (x: number) =>
  x < 18 ? 'translate-x-0' : x > 82 ? '-translate-x-full' : '-translate-x-1/2';

/** Escala horizontal con marcador «Tú» (arriba) y «Promedio de los encuestados» (abajo). */
function EscalaComparada({
  pregunta: p,
  valor,
  promedio,
  compacta = false,
}: {
  pregunta: PreguntaQuiz;
  valor: number | null;
  promedio: number;
  compacta?: boolean;
}) {
  const [lo, hi] = rangoPregunta(p);
  const xP = posicionEnEscala(p, promedio);
  const xT = valor == null ? null : posicionEnEscala(p, valor);
  const desc = `Escala de ${lo} a ${hi}. ${PROMEDIO_ENCUESTADOS}: ${decimal(promedio)}${
    valor == null ? '' : `. Tu respuesta: ${valor}`
  }.`;
  return (
    <div role="img" aria-label={desc} className={compacta ? 'pt-1 pb-1' : 'pt-8 pb-9'}>
      <div className="relative h-2 rounded-full bg-chart-track">
        {/* Promedio */}
        <span
          className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-chart-ink"
          style={{ left: `${xP}%` }}
        />
        {!compacta && (
          <span
            className={`absolute top-4 text-xs whitespace-nowrap text-ink-muted ${anclaje(xP)}`}
            style={{ left: `${xP}%` }}
          >
            Promedio de los encuestados: <b className="text-ink">{decimal(promedio)}</b>
          </span>
        )}
        {/* Tú */}
        {xT != null && (
          <>
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-chart-accent shadow-[0_0_0_1px_var(--color-chart-accent)] transition-[left] duration-300 motion-reduce:transition-none"
              style={{ left: `${xT}%` }}
            />
            {!compacta && (
              <span
                className={`absolute -top-7 text-sm font-bold whitespace-nowrap text-chart-accent transition-[left] duration-300 motion-reduce:transition-none ${anclaje(xT)}`}
                style={{ left: `${xT}%` }}
              >
                Tú: {valor}
              </span>
            )}
          </>
        )}
      </div>
      {!compacta && (
        <div className="mt-8 flex justify-between text-xs text-ink-muted" aria-hidden="true">
          <span>
            {lo} · {p.etiquetasExtremos?.[0]}
          </span>
          <span className="text-right">
            {p.etiquetasExtremos?.[1]} · {hi}
          </span>
        </div>
      )}
    </div>
  );
}

/** Barra 0–100 % partida en «grupo» / «resto», con marcador «Tú» en tu parte. */
function BarraGrupo({
  c,
  dentro,
  etiqueta,
  compacta = false,
}: {
  c: ComparacionPorcentaje;
  dentro: boolean | null;
  etiqueta?: string;
  compacta?: boolean;
}) {
  const g = Math.round(c.valor);
  const xT = dentro == null ? null : dentro ? g / 2 : (100 + g) / 2;
  const desc = `${pct(c.valor)} ${DE_LOS_ENCUESTADOS}: ${c.etiquetaGrupo.toLowerCase()}; ${pct(
    100 - c.valor,
  )}: ${c.etiquetaFuera.toLowerCase()}.${
    dentro == null ? '' : ` Tú estás en el grupo «${dentro ? c.etiquetaGrupo : c.etiquetaFuera}».`
  }`;
  return (
    <div role="img" aria-label={desc} className={compacta ? 'pt-1 pb-1' : 'pt-8'}>
      <div className="relative flex h-3 overflow-visible">
        <span className="h-full bg-chart-accent" style={{ width: `${g}%` }} />
        <span className="h-full flex-1 bg-chart-track" />
        {xT != null && (
          <>
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-chart-strong shadow-[0_0_0_1px_var(--color-chart-strong)] transition-[left] duration-300 motion-reduce:transition-none"
              style={{ left: `${xT}%` }}
            />
            {!compacta && (
              <span
                className={`absolute -top-7 text-sm font-bold whitespace-nowrap text-chart-strong ${anclaje(xT)}`}
                style={{ left: `${xT}%` }}
              >
                Tú{etiqueta ? `: ${etiqueta}` : ''}
              </span>
            )}
          </>
        )}
      </div>
      {!compacta && (
        <div className="mt-3 grid grid-cols-2 gap-4 text-xs leading-snug" aria-hidden="true">
          <p className={dentro === true ? 'font-semibold text-ink' : 'text-ink-muted'}>
            <span className="block text-lg font-bold text-chart-accent tabular-nums">
              {pct(c.valor)}
            </span>
            {c.etiquetaGrupo}
          </p>
          <p
            className={`text-right ${dentro === false ? 'font-semibold text-ink' : 'text-ink-muted'}`}
          >
            <span className="block text-lg font-bold text-ink tabular-nums">
              {pct(100 - c.valor)}
            </span>
            {c.etiquetaFuera}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- resumen */

function FilaFinal({ pregunta: p, e }: { pregunta: PreguntaQuiz; e: Evaluacion }) {
  const c = p.comparacion;
  return (
    <li className="py-3 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <a
          href={temaHref(p.tema)}
          className="font-semibold text-ink underline-offset-4 hover:underline"
        >
          {p.temaTitulo}
        </a>
        <span className="text-ink-muted tabular-nums">
          Tú: <b className="text-ink">{e.etiqueta}</b> ·{' '}
          {c.modo === 'promedio' ? `Promedio: ${decimal(c.valor)}` : `${pct(c.valor)} en el grupo`}
        </span>
      </div>
      <div className="mt-2">
        {c.modo === 'promedio' ? (
          <EscalaComparada pregunta={p} valor={e.valor} promedio={c.valor} compacta />
        ) : (
          <BarraGrupo c={c} dentro={e.dentroDelGrupo ?? null} compacta />
        )}
      </div>
      <p className="mt-2 text-sm leading-snug text-ink">{e.texto}</p>
    </li>
  );
}

function Acciones({
  onRepetir,
  href,
  children,
}: {
  onRepetir: () => void;
  href: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
      <button type="button" className={btnTexto} onClick={onRepetir}>
        <span aria-hidden="true">↻</span> Repetir
      </button>
      <a href={href} className={btnContorno}>
        {children} <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
