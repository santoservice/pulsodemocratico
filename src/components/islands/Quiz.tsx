import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { decimal, entero, pct } from '../../lib/format';
import { ruta } from '../../lib/rutas';
import {
  DE_LOS_ENCUESTADOS,
  PROMEDIO_ENCUESTADOS,
  destacadoResultado,
  evaluarRespuesta,
  etiquetaRespuesta,
  posicionEnEscala,
  rangoPregunta,
  resumenFinal,
  valoresPregunta,
  type ComparacionPorcentaje,
  type Destacado,
  type Evaluacion,
  type PreguntaQuiz,
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
  'inline-flex min-h-11 items-center justify-center gap-2 border px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
const btnPrimario = `${btnBase} border-accent bg-accent text-on-accent hover:enabled:bg-accent-hover`;
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
    <div className="flex min-h-[30rem] min-w-0 flex-col border border-border bg-surface p-4 sm:p-6 md:p-8">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-ink-muted">
        <p>
          Pregunta {vista === 'final' ? total : paso + 1} de {total}
        </p>
        <button type="button" className={btnTexto} onClick={reiniciar}>
          Empezar de nuevo <span aria-hidden="true">↺</span>
        </button>
      </div>
      <ol className="mb-6 flex gap-1.5" aria-hidden="true">
        {preguntas.map((q, k) => {
          const hecha = vista === 'final' || k < paso || (k === paso && vista === 'resultado');
          return (
            <li
              key={q.id}
              className={`h-1.5 flex-1 transition-colors duration-300 ${
                hecha ? 'bg-accent' : k === paso ? 'bg-accent/40' : 'bg-surface-sunken'
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
            <button
              type="button"
              className={btnTexto}
              onClick={() => cambiar('pregunta', paso - 1)}
              disabled={paso === 0}
            >
              <span aria-hidden="true">←</span> Anterior
            </button>
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
            <CifraDestacada d={destacado!} />
            <span className="mt-1 block text-lg leading-snug font-semibold text-ink sm:text-xl">
              {destacado!.frase[0]!.toUpperCase() === destacado!.frase[0]
                ? destacado!.frase
                : destacado!.frase}
            </span>
          </h3>
          <div className="mt-6">
            <GraficaResultado pregunta={p} valor={valor!} />
          </div>
          {destacado!.contexto && (
            <p className="mt-5 text-sm text-ink-muted">{destacado!.contexto}</p>
          )}
          <p className="mt-1 text-xs text-ink-muted">
            {p.ronda} · {entero(p.n)} personas encuestadas.
          </p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
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
            ¡Listo! Este es tu resultado final.
          </h3>
          <p className="mt-2 leading-relaxed text-ink-muted">
            Así te comparas con el {PROMEDIO_ENCUESTADOS} en cada tema.
          </p>
          <ul className="mt-5 divide-y divide-border">
            {resumen.evaluaciones.map((e) => {
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
          {resumen.texto && <p className="mt-4 leading-relaxed text-ink">{resumen.texto}</p>}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
            <button type="button" className={btnTexto} onClick={() => cambiar('pregunta', 0)}>
              <span aria-hidden="true">←</span> Revisar mis respuestas
            </button>
            <a href={ruta('/resultados')} className={enlaceTexto}>
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
                  ? 'min-h-18 px-3 py-4 text-base leading-tight'
                  : 'h-12 min-w-0 flex-1 px-0 text-sm sm:h-14 sm:text-base'
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

/* ------------------------------------------------------------ animación */

/** Tiempos (ms) de la revelación: escala → promedio (se desliza y cuenta) → «Tú» → texto. */
const DURACION_ESCALA = 450;
const RETRASO_DATO = 300;
const DURACION_DATO = 900;
const RETRASO_TU = RETRASO_DATO + DURACION_DATO;

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

/** Cifra principal del resultado ("39 %" o "77/100"), que cuenta desde 0. */
function CifraDestacada({ d }: { d: Destacado }) {
  const n = useContador(d.valor, true);
  return (
    <span className="block text-5xl leading-none font-bold tracking-tight text-grana tabular-nums sm:text-6xl">
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

/** Estilo del marcador «Tú»: brota en su sitio cuando el dato ya llegó. */
const estiloTu = (left: number, listo: boolean, animar: boolean) => ({
  left: `${left}%`,
  ...(animar && {
    opacity: listo ? 1 : 0,
    scale: listo ? '1' : '0.3',
    ...transicion('opacity, scale', 350, RETRASO_TU),
  }),
});

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
  animar = false,
}: {
  pregunta: PreguntaQuiz;
  valor: number | null;
  promedio: number;
  compacta?: boolean;
  animar?: boolean;
}) {
  const [lo, hi] = rangoPregunta(p);
  const listo = useArranque(animar);
  const cuenta = useContador(promedio, animar);
  const xP0 = posicionEnEscala(p, promedio);
  const xP = listo ? xP0 : 0;
  const xT = valor == null ? null : posicionEnEscala(p, valor);
  const desc = `Escala de ${lo} a ${hi}. ${PROMEDIO_ENCUESTADOS}: ${decimal(promedio)}${
    valor == null ? '' : `. Tu respuesta: ${valor}`
  }.`;
  return (
    <div role="img" aria-label={desc} className={compacta ? 'pt-1 pb-1' : 'pt-8 pb-9'}>
      <div className="relative h-2">
        <div
          className="absolute inset-0 origin-left rounded-full bg-chart-track"
          style={
            animar
              ? { scale: listo ? '1 1' : '0 1', ...transicion('scale', DURACION_ESCALA) }
              : undefined
          }
        />
        {/* Promedio */}
        <span
          className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-chart-ink"
          style={{
            left: `${xP}%`,
            ...(animar && transicion('left', DURACION_DATO, RETRASO_DATO)),
          }}
        />
        {!compacta && (
          <span
            className={`absolute top-4 text-xs whitespace-nowrap text-ink-muted ${anclaje(xP0)}`}
            style={{
              left: `${xP}%`,
              ...(animar && transicion('left', DURACION_DATO, RETRASO_DATO)),
            }}
          >
            Promedio de los encuestados: <b className="text-ink tabular-nums">{decimal(cuenta)}</b>
          </span>
        )}
        {/* Tú */}
        {xT != null && (
          <>
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-chart-accent shadow-[0_0_0_1px_var(--color-chart-accent)]"
              style={estiloTu(xT, listo, animar)}
            />
            {!compacta && (
              <span
                className={`absolute -top-7 text-sm font-bold whitespace-nowrap text-chart-accent ${anclaje(xT)}`}
                style={estiloTu(xT, listo, animar)}
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
  animar = false,
}: {
  c: ComparacionPorcentaje;
  dentro: boolean | null;
  etiqueta?: string;
  compacta?: boolean;
  animar?: boolean;
}) {
  const g = Math.round(c.valor);
  const listo = useArranque(animar);
  const cuenta = useContador(c.valor, animar);
  const xT = dentro == null ? null : dentro ? g / 2 : (100 + g) / 2;
  const desc = `${pct(c.valor)} ${DE_LOS_ENCUESTADOS}: ${c.etiquetaGrupo.toLowerCase()}; ${pct(
    100 - c.valor,
  )}: ${c.etiquetaFuera.toLowerCase()}.${
    dentro == null ? '' : ` Tú estás en el grupo «${dentro ? c.etiquetaGrupo : c.etiquetaFuera}».`
  }`;
  return (
    <div role="img" aria-label={desc} className={compacta ? 'pt-1 pb-1' : 'pt-8'}>
      <div className="relative flex h-3 overflow-visible">
        <span
          className="h-full bg-chart-accent"
          style={{
            width: `${listo ? g : 0}%`,
            ...(animar && transicion('width', DURACION_DATO, RETRASO_DATO)),
          }}
        />
        <span className="h-full flex-1 bg-chart-track" />
        {xT != null && (
          <>
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-chart-strong shadow-[0_0_0_1px_var(--color-chart-strong)]"
              style={estiloTu(xT, listo, animar)}
            />
            {!compacta && (
              <span
                className={`absolute -top-7 text-sm font-bold whitespace-nowrap text-chart-strong ${anclaje(xT)}`}
                style={estiloTu(xT, listo, animar)}
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
              {pct(cuenta)}
            </span>
            {c.etiquetaGrupo}
          </p>
          <p
            className={`text-right ${dentro === false ? 'font-semibold text-ink' : 'text-ink-muted'}`}
          >
            <span className="block text-lg font-bold text-ink tabular-nums">
              {pct(100 - cuenta)}
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
