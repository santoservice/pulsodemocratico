import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { decimal, entero, pct } from '../../lib/format';
import { ruta } from '../../lib/rutas';
import {
  PROMEDIO_ENCUESTADOS,
  destacadoResultado,
  evaluarRespuesta,
  etiquetaRespuesta,
  rangoPregunta,
  resumenFinal,
  valoresPregunta,
  type Destacado,
  type Evaluacion,
  type PreguntaQuiz,
  type Trozo,
} from '../../lib/quiz';
import { GraficaResultado } from './GraficasQuiz';

/**
 * Quiz «¿Dónde te ubicas frente al resto del país?» (PLAN.md §4.1, §6). Isla `client:visible`.
 *
 * Una sola tarjeta: «Pregunta N de M» + «Empezar de nuevo» arriba y, debajo, la barra de progreso.
 * Elegir una opción no revela nada; «Siguiente» reemplaza la pregunta por «Tu resultado» en la
 * misma tarjeta, con una animación (la escala se dibuja, el promedio se desliza y cuenta,
 * aparece «Tú»), y «Continuar» pasa a la pregunta siguiente. Al terminar: «¡Listo!» + «Tu
 * resultado final» con las comparaciones. Nada se guarda ni se envía.
 *
 * Sin librerías de gráficas: las mini-visualizaciones son HTML/CSS con tokens del tema.
 */
interface Props {
  preguntas: readonly PreguntaQuiz[];
}

type Vista = 'pregunta' | 'resultado' | 'final';

const temaHref = (slug: string) => ruta(`/resultados/${slug}`);
const btnBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
const btnPrimario = `${btnBase} border-accent bg-accent text-on-accent hover:enabled:bg-accent-hover dark:border-white dark:bg-white dark:text-negro dark:hover:enabled:border-cream dark:hover:enabled:bg-cream`;
const btnTexto =
  'inline-flex min-h-11 items-center gap-1 px-1 font-medium text-ink underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline disabled:opacity-60';
const enlaceTexto =
  'inline-flex min-h-11 items-center gap-1 px-1 font-medium text-accent underline-offset-4 hover:underline';

export default function Quiz({ preguntas }: Props) {
  const total = preguntas.length;
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => preguntas.map(() => null));
  const [vista, setVista] = useState<Vista>('pregunta');
  const [enfocar, setEnfocar] = useState(false);
  const [interactuado, setInteractuado] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const uid = useId();

  // Tras cambiar de vista, el foco va al título nuevo (no en la carga inicial).
  useEffect(() => {
    if (!enfocar) return;
    tituloRef.current?.focus();
    setEnfocar(false);
  }, [enfocar]);

  const p = preguntas[paso]!;
  const valor = respuestas[paso] ?? null;
  const evaluacion = vista === 'resultado' && valor != null ? evaluarRespuesta(p, valor) : null;
  const destacado = evaluacion ? destacadoResultado(p, evaluacion.valor) : null;
  const ultima = paso === total - 1;

  const cambiar = (v: Vista, k = paso) => {
    setPaso(k);
    setVista(v);
    setEnfocar(true);
    setInteractuado(true);
  };
  const responder = (v: number) => setRespuestas((rs) => rs.map((r, k) => (k === paso ? v : r)));
  const reiniciar = () => {
    setRespuestas(preguntas.map(() => null));
    cambiar('pregunta', 0);
  };
  const continuar = () => (ultima ? cambiar('final') : cambiar('pregunta', paso + 1));

  const qId = `${uid}-q`;
  const resumen =
    vista === 'final'
      ? resumenFinal(preguntas, Object.fromEntries(preguntas.map((q, k) => [q.id, respuestas[k]])))
      : null;
  const titulo =
    'text-xl leading-snug font-semibold text-ink focus:outline-none focus-visible:outline-2 sm:text-2xl';

  return (
    <div className="flex min-h-[30rem] min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 sm:p-6 xl:p-7 dark:border-white/10 dark:bg-[#06132e] dark:shadow-2xl dark:shadow-black/40">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-ink-muted">
        <p>
          {vista === 'final' ? 'Tu resultado final' : `Pregunta ${paso + 1} de ${total}`}
        </p>
        <button type="button" className={btnTexto} onClick={reiniciar}>
          Empezar de nuevo <span aria-hidden="true">↺</span>
        </button>
      </div>
      <ol className="mb-5 flex gap-1.5" aria-hidden="true">
        {preguntas.map((q, k) => {
          const hecha = vista === 'final' || k < paso || (k === paso && vista === 'resultado');
          return (
            <li
              key={q.id}
              className={`h-1.5 flex-1 transition-colors duration-300 ${
                hecha
                  ? 'bg-accent dark:bg-cream'
                  : k === paso
                    ? 'bg-accent/40 dark:bg-cream/40'
                    : 'bg-surface-sunken'
              }`}
            />
          );
        })}
      </ol>

      {vista === 'pregunta' && (
        <Aparece
          key={`q-${p.id}`}
          retraso={0}
          activo={interactuado}
          className="flex flex-1 flex-col"
        >
          <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
            {p.temaTitulo}
          </p>
          <h3 id={qId} ref={tituloRef} tabIndex={-1} className={`mt-1 ${titulo}`}>
            {p.texto}
          </h3>
          <Opciones pregunta={p} valor={valor} labelledBy={qId} onChange={responder} />
          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
            {/* En la primera pregunta no hay "Anterior"; el span mantiene "Siguiente" a la derecha. */}
            {paso > 0 ? (
              <button
                type="button"
                className={btnTexto}
                onClick={() => cambiar('pregunta', paso - 1)}
              >
                <span aria-hidden="true">←</span> Anterior
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className={btnPrimario}
              disabled={valor == null}
              onClick={() => cambiar('resultado')}
            >
              Siguiente <span aria-hidden="true">→</span>
            </button>
          </div>
        </Aparece>
      )}

      {vista === 'resultado' && evaluacion && (
        <Aparece key={`r-${p.id}`} retraso={0} className="flex flex-1 flex-col">
          <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
            Tu resultado · {p.temaTitulo}
          </p>
          {/* Lo primero que se lee: cifra grande + frase corta. */}
          <h3
            ref={tituloRef}
            tabIndex={-1}
            className="mt-2 focus:outline-none focus-visible:outline-2"
            aria-live="polite"
          >
            {destacado!.sello && (
              <span className="mb-2 inline-block rounded-full bg-accent px-3 py-0.5 text-xs font-bold tracking-wide text-on-accent uppercase dark:bg-cream dark:text-navy">
                {destacado!.sello}
              </span>
            )}
            <CifraDestacada d={destacado!} />
            <span className="mt-2 block text-lg leading-snug text-ink sm:text-xl">
              <Trozos trozos={destacado!.frase} />
            </span>
          </h3>
          <div className="mt-4">
            <GraficaResultado pregunta={p} valor={valor!} />
          </div>
          {destacado!.curioso && (
            // Solo texto (sin caja, para no alargar la tarjeta), más visible que la nota de abajo.
            <p className="mt-4 text-sm leading-snug text-ink sm:text-base dark:text-cream">
              <Trozos trozos={destacado!.curioso} />
            </p>
          )}
          {destacado!.contexto && (
            <p className="mt-2 text-sm text-ink-muted">{destacado!.contexto}</p>
          )}
          <p className="mt-1 text-xs text-ink-muted">
            {p.ronda} · {entero(p.n)} personas encuestadas.
          </p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <a href={temaHref(p.tema)} className={enlaceTexto}>
              Ver resultados del tema <span aria-hidden="true">→</span>
            </a>
            <button type="button" className={btnPrimario} onClick={continuar}>
              Continuar <span aria-hidden="true">→</span>
            </button>
          </div>
        </Aparece>
      )}

      {vista === 'final' && resumen && (
        <Aparece key="final" retraso={0} className="flex flex-1 flex-col">
          <h3 ref={tituloRef} tabIndex={-1} className={titulo}>
            ¡Listo! Respondiste las {resumen.respondidas} preguntas.
          </h3>
          <p className="mt-1 text-ink-muted">Así te comparas con los encuestados en cada tema.</p>
          {/* Resumen en texto (sin gráficas): la tarjeta no crece más que las anteriores. */}
          <ul className="mt-4 flex flex-col gap-3">
            {resumen.evaluaciones.map((e) => {
              const q = preguntas.find((x) => x.id === e.preguntaId)!;
              return <FilaFinal key={q.id} pregunta={q} e={e} />;
            })}
          </ul>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
            <button type="button" className={btnTexto} onClick={() => cambiar('pregunta', 0)}>
              <span aria-hidden="true">←</span> Revisar mis respuestas
            </button>
            <a href={ruta('/resultados')} className={btnPrimario}>
              Ver todos los resultados <span aria-hidden="true">→</span>
            </a>
          </div>
        </Aparece>
      )}
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
            ? 'grid grid-cols-2 gap-3'
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
                  ? 'min-h-18 rounded-xl px-3 py-4 text-base leading-tight'
                  : 'h-12 min-w-0 flex-1 rounded-lg px-0 text-sm sm:h-14 sm:text-base'
              } ${
                sel
                  ? 'border-accent bg-accent text-on-accent dark:border-cream dark:bg-cream dark:text-navy'
                  : 'border-border-strong bg-surface text-ink hover:border-ink hover:bg-surface-muted dark:border-[#7088b2] dark:bg-surface-muted dark:hover:border-white dark:hover:bg-[#1d3c72]'
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

/* ------------------------------------------------------------ animación */

/** Tiempos (ms) de la cifra del resultado: espera y conteo. */
const RETRASO_DATO = 300;
const DURACION_DATO = 900;

const sinMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** false en el primer pintado y true justo después, para que las transiciones CSS arranquen. */
function useArranque(activo: boolean) {
  const [listo, setListo] = useState(!activo);
  useEffect(() => {
    if (!activo) return;
    if (sinMovimiento()) return setListo(true);
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setListo(true))));
    return () => cancelAnimationFrame(id);
  }, [activo]);
  return listo;
}

/** Cuenta de 0 a `objetivo` (con easing) tras `RETRASO_DATO`. */
function useContador(objetivo: number, activo: boolean) {
  const [n, setN] = useState(activo ? 0 : objetivo);
  useEffect(() => {
    if (!activo || sinMovimiento()) return setN(objetivo);
    let id = 0;
    const t0 = performance.now() + RETRASO_DATO;
    const paso = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / DURACION_DATO));
      setN(objetivo * (1 - (1 - k) ** 3));
      if (k < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [objetivo, activo]);
  return n;
}

const transicion = (prop: string, ms: number, retraso = 0) => ({
  transition: `${prop} ${ms}ms cubic-bezier(0.22, 1, 0.36, 1) ${retraso}ms`,
});

/**
 * Aparece (fundido + leve subida) tras `retraso` ms. Con `activo={false}` se pinta tal cual
 * (primera pregunta pre-renderizada: visible sin esperar al JS).
 */
function Aparece({
  retraso,
  activo = true,
  className = '',
  children,
}: {
  retraso: number;
  activo?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const listo = useArranque(activo);
  return (
    <div
      className={`motion-reduce:transition-none! ${className}`}
      style={{
        opacity: listo ? 1 : 0,
        transform: listo ? 'none' : 'translateY(6px)',
        ...transicion('opacity, transform', 400, retraso),
      }}
    >
      {children}
    </div>
  );
}

/** Texto con partes en negrilla. */
function Trozos({ trozos }: { trozos: readonly Trozo[] }) {
  return (
    <>
      {trozos.map((x, k) =>
        x.b ? (
          <strong key={k} className="font-bold">
            {x.t}
          </strong>
        ) : (
          <span key={k}>{x.t}</span>
        ),
      )}
    </>
  );
}

/** Cifra principal del resultado ("39 %" o "77/100"), que cuenta desde 0. */
function CifraDestacada({ d }: { d: Destacado }) {
  const n = useContador(d.valor, true);
  return (
    <span className="block text-5xl leading-none font-bold tracking-tight text-grana tabular-nums sm:text-[3.25rem]">
      {d.formato === 'pct' ? (
        pct(n)
      ) : (
        <>
          {entero(n)}
          <span className="text-3xl text-ink-muted sm:text-4xl">/100</span>
        </>
      )}
    </span>
  );
}

/* ------------------------------------------------------------- resumen */

/** "39 %", o "menos del 1 %" si es casi nadie. */
const pctIgual = (v: number) => (v < 0.5 ? 'menos del 1 %' : `el ${pct(v)}`);

/** Una línea por tema: tu respuesta, cuántos respondieron igual y dónde quedas. */
function FilaFinal({ pregunta: p, e }: { pregunta: PreguntaQuiz; e: Evaluacion }) {
  const c = p.comparacion;
  const [lo, hi] = rangoPregunta(p);
  return (
    <li>
      <a
        href={temaHref(p.tema)}
        className="font-bold text-accent underline-offset-4 hover:underline"
      >
        {p.temaTitulo}
      </a>
      <p className="mt-0.5 text-sm leading-snug text-ink">
        Respondiste{' '}
        <strong>
          {p.tipo === 'opciones' ? `«${e.etiqueta}»` : `${e.etiqueta} (de ${lo} a ${hi})`}
        </strong>
        , igual que <strong>{pctIgual(e.pctMismaRespuesta)}</strong>.{' '}
        <span className="text-ink-muted">
          {c.modo === 'promedio' ? (
            e.posicion === 'igual' ? (
              <>
                Estás prácticamente en el {PROMEDIO_ENCUESTADOS} ({decimal(c.valor)}).
              </>
            ) : (
              <>
                Estás {e.posicion} del {PROMEDIO_ENCUESTADOS} ({decimal(c.valor)}).
              </>
            )
          ) : (
            <>
              Estás entre el {pct(e.dentroDelGrupo ? c.valor : 100 - c.valor)} que{' '}
              {e.dentroDelGrupo ? c.descripcionGrupo : c.descripcionFuera}.
            </>
          )}
        </span>
      </p>
    </li>
  );
}
