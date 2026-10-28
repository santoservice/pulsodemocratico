# Pulso Democrático — Plan de proyecto

Sitio web para presentar los resultados de la encuesta panel **CNEP Colombia 2026** (Universidad de Wisconsin, Universidad Externado, Universidad de La Sabana, Universitat Pompeu Fabra).

**Objetivo:** que la gente entienda los datos *sin leer mucho*. Primero el dato grande y la gráfica; el detalle técnico, después y opcional.

Fuentes de este plan:
- `maqueta.pptx` (5 diapositivas: especificaciones + 4 páginas) → **estructura a seguir**.
- `Tablero 2.0 CNEP Colombia 2026 (autocontenido).html` → **fuente de datos** (objeto `TABLERO`) e ideas de visualización. No se copia su diseño.

---

## 1. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Framework | **Astro** (salida estática) + **React** solo en "islas" interactivas |
| Rutas de resultados | **Una página por tema** (`/resultados/polarizacion`, …). Las "cajas" de la maqueta son links |
| Gráficas | **SVG propio** generado en build con `d3-scale`, `d3-shape`, `d3-array` (sin JS en el cliente salvo interacción) |
| Estilos | **Tailwind CSS v4** con tokens de diseño (`@theme`) |
| Datos | **JSON del tablero** (`TABLERO`) validado con Zod en una content collection |
| Quiz | Preguntas configurables en un array; fórmula provisional (se ajusta cuando lleguen las preguntas reales) |
| Hosting | **Cloudflare Pages** (build estático `dist/`) |
| Idioma | Español (`lang="es-CO"`). i18n fuera de alcance por ahora |

---

## 2. Stack y herramientas

| Capa | Herramienta | Por qué |
|---|---|---|
| Runtime | Node **22 LTS** (hoy hay 20.19 instalado → actualizar) | Versiones actuales de Astro requieren Node 22 |
| Gestor de paquetes | **pnpm** (ya instalado, 10.12) | Rápido, lockfile estricto |
| Framework | `astro` | HTML estático por defecto = SEO y velocidad |
| Interactividad | `@astrojs/react` + React 19 | Quiz, modal de pregunta, tooltips |
| Estilos | `tailwindcss` v4 + `@tailwindcss/vite` | Tokens, responsive rápido |
| Gráficas | `d3-scale`, `d3-shape`, `d3-array`, `d3-format` | Cálculo de escalas/paths; el SVG lo pintamos nosotros |
| Validación | `zod` (vía `astro:content`) | Si el JSON cambia de forma, el build falla con error claro |
| SEO | `@astrojs/sitemap`, componente `<Seo>` propio, JSON-LD | Ver §7 |
| Imágenes OG | `satori` + `@resvg/resvg-js` (o `astro-og-canvas`) | Imagen para compartir por tema con el dato principal |
| Iconos | `astro-icon` + Lucide / Phosphor | Reemplaza los "Vector" de la maqueta |
| Fuentes | `@fontsource-variable/*` (autohospedadas) | Sin dependencia de Google Fonts, mejor rendimiento |
| Calidad | ESLint, Prettier (+ plugin Astro y Tailwind), `astro check` | |
| Pruebas | Sin tests unitarios (decisión del cliente: sitio sencillo); verificación con `astro check`, lint y build | |
| Rendimiento | Lighthouse CI en GitHub Actions | Meta: ≥95 en Performance, SEO y Accesibilidad |
| Deploy | Cloudflare Pages conectado a GitHub (preview por PR) | |

---

## 3. Mapa del sitio

```
/                               Inicio
/resultados                     Principales hallazgos (resumen de todos los temas)
/resultados/polarizacion
/resultados/populismo
/resultados/desinformacion
/resultados/inteligencia-artificial
/resultados/consumo-mediatico
/resultados/jovenes
/como-se-hizo                   ¿Cómo se hizo la encuesta?
/sobre-el-proyecto              Sobre el proyecto
/404
```

Opcional (fase posterior): `/resultados/[tema]/[pregunta]` — página propia por pregunta para que el modal tenga URL compartible e indexable. Ver §6.4.

Menú: `Inicio · Resultados ▾ · ¿Cómo se hizo la encuesta? · Sobre el proyecto`. "Resultados" despliega los 6 temas (hover en escritorio, tap en móvil).

---

## 4. Wireframes (baja fidelidad)

Convenciones: `[ ]` caja/componente · `▓` gráfica · `(i)` isla React (JS en cliente). Todas las páginas comparten **Header** y **Footer** (logos de instituciones).

### 4.1 Inicio `/`

```
┌──────────────────────────────────────────────────────────────┐
│ Pulso Democrático     Inicio  Resultados▾  ¿Cómo se hizo?  Sobre │
├──────────────────────────────────────────────────────────────┤
│ [ FOTO 1 — contexto campaña Colombia 2026 (hero, ancho total) ]│
│                                                              │
│  PULSO DEMOCRÁTICO                       ← h1                │
│  Lo que piensa la ciudadanía colombiana: resultados de la    │
│  encuesta nacional CNEP, aplicada durante las elecciones 2026│
├──────────────────────────────────────────────────────────────┤
│ ¿Dónde te ubicas     │ (i) QUIZ                              │
│ frente al resto      │ Pregunta 2 de 4  ▬▬▬▬ ▬▬▬▬ ──── ────  │
│ del país?            │ ¿Qué tan dispuesto estarías a…?       │
│ Responde 4 preguntas │ [0][1][2][3][4][5][6][7][8][9][10]    │
│ y compárate.         │ Nada dispuesto        Muy dispuesto   │
│ Toma 2 min. No se    │ ← Anterior              [Siguiente]   │
│ guardan respuestas.  │ ── al terminar ──                     │
│                      │ Tu resultado  ──────|───▼──── espectro│
│                      │ Promedio encuestados 4,9 · Tú 6,8     │
│                      │ ↻ Repetir   [Ver resultados del tema] │
├──────────────────────────────────────────────────────────────┤
│ [ico] 3 rondas  [ico] 2.008 personas  [ico] 53 preguntas  [ico] 4 regiones │
├──────────────────────────────────────────────────────────────┤
│ Explora los temas principales                                │
│ ┌────────┐ ┌────────┐ ┌────────┐                             │
│ │ ilustr.│ │ ilustr.│ │ ilustr.│   6 tarjetas iguales         │
│ │Polariz.│ │Populism│ │Desinfo.│   ilustración vectorial      │
│ │pregunta│ │pregunta│ │pregunta│   + pregunta gancho          │
│ │[Ver →] │ │[Ver →] │ │[Ver →] │   + botón al tema            │
│ └────────┘ └────────┘ └────────┘                             │
│ ┌────────┐ ┌────────┐ ┌────────┐                             │
│ │  IA    │ │Consumo │ │Jóvenes │                             │
│ └────────┘ └────────┘ └────────┘                             │
├──────────────────────────────────────────────────────────────┤
│ Footer: logos instituciones                                  │
└──────────────────────────────────────────────────────────────┘
Móvil: quiz a ancho completo debajo del texto; tarjetas 1 columna;
cifras en grilla 2×2.
```

**Mejora sugerida (llamar la atención):** entre las cifras y las tarjetas, una franja de **3 "datos que sorprenden"** (número gigante + frase de una línea + link al tema). Usa los indicadores `destacado: true` del JSON.

### 4.2 Resultados `/resultados` y `/resultados/[tema]`

```
┌──────────────────────────────────────────────────────────────┐
│ COLOMBIA 2026                                                │
│ Resultados de la encuesta              ← h1 (o nombre tema)  │
│ Bajada corta                                                 │
│                                                              │
│ [Principales][Polariz.][Populismo][Desinfo.][IA][Consumo][Jóvenes] │
│   ↑ links a páginas; activo resaltado; en móvil scroll horiz.│
│                                                              │
│ [3 rondas] [2.008 personas] [53 preguntas] [4 regiones]      │
│                                                              │
│ Principales hallazgos / <Tema>                               │
│ ┌───────────────────────┐ ┌───────────────────────┐          │
│ │01 Título hallazgo   › │ │02 Título            › │          │
│ │ ▓▓ gráfica   • leyenda│ │ ▓▓▓▓▓▓▓▓ barras       │          │
│ │ Dato grande + 1 frase │ │                       │          │
│ └───────────────────────┘ └───────────────────────┘          │
│ … tarjetas 03–N (cantidad varía por tema)                    │
│   clic en tarjeta → (i) MODAL con detalle de la pregunta     │
└──────────────────────────────────────────────────────────────┘
Escritorio 2 columnas · móvil 1 columna.
```

- `/resultados`: 1–2 hallazgos destacados por tema (`destacado: true`), cada uno con link a su tema.
- `/resultados/[tema]`: todos los indicadores del tema, agrupados por `familia`.

**Modal de pregunta (isla React):**

```
┌───────────────────────────────────────────── ✕ ┐
│ POLARIZACIÓN                                   │
│ Qué tan dividido ve al país                    │
│ "Pregunta original textual…"                   │
│ Cómo se lee: …                                 │
│ ── Cambio entre rondas ── ▓ línea R1→R2→R3     │
│ ── Quiénes se diferencian ──                   │
│   Edad      ●──●────●───●   (solo significativos)│
│   Estrato   ●────●──●                          │
│ ▸ Detalle técnico (colapsado)                  │
└────────────────────────────────────────────────┘
```
Cierra con Esc, foco atrapado, `?pregunta=<key>` en la URL para compartir.

### 4.3 ¿Cómo se hizo la encuesta? `/como-se-hizo`

```
COLOMBIA 2026
¿Cómo se hizo la encuesta?        ← h1
Párrafo intro (panel, CNEP)

┌ Ficha técnica ────────────────────────────────────┐
│ [ico] Objetivo  [ico] Realizado por  [ico] Población  [ico] Tipo │
│ [ico] Muestra   [ico] Periodo        [ico] Cobertura  [ico] Marco│
│ [ico] Selección [ico] Recolección    [ico] Ref. pobl. [ico] Ponderación │
└───────────────────────────────────────────────────┘  (4 col → 2 → 1)

Así funciona el panel
[Ronda 1 · 4–19 may · 2.008] → [Ronda 2 · 4–16 jun · 1.492] → [Ronda 3 · 24 jun–5 jul · 1.175]
└──────────── Mismas personas en las tres rondas ────────────┘
   (en móvil: línea de tiempo vertical)

[Qué puede y qué no puede decir esta encuesta]   ← del HTML, recomendado
  Sí sirve para… / No sirve para…

┌ CTA ─────────────────────────────────────┐
│ ¿Quieres todos los datos? [Ir al sitio de CNEP ↗] │
└──────────────────────────────────────────┘
```

### 4.4 Sobre el proyecto `/sobre-el-proyecto`

```
COLOMBIA 2026
Sobre el proyecto                     ← h1
Bajada (pendiente)

¿Qué es?                    │ UNA INICIATIVA DE
texto (pendiente)           │ [logo][logo][logo][logo]

¿Por qué es importante?
[ (ico personas) título + texto ] [ (ico barras) título + texto ]

Equipo de trabajo
[foto · nombre · rol] ×7   (3 col → 2 → 1)
```

---

## 5. Arquitectura del proyecto

```
pulsodemocratico/
├─ astro.config.mjs          # site, integraciones (react, sitemap), vite tailwind
├─ public/
│  ├─ favicon.svg  robots.txt  _headers  (cache Cloudflare)
├─ scripts/
│  └─ extract-tablero.ts     # extrae TABLERO del HTML autocontenido → JSON
├─ src/
│  ├─ assets/                # fotos, ilustraciones, logos (optimizados con astro:assets)
│  ├─ content/
│  │  ├─ temas/*.md          # textos editoriales por tema (bajada, intro, pregunta gancho, ilustración)
│  │  ├─ equipo/*.md         # integrantes (nombre, rol, foto)
│  │  └─ paginas/*.md        # textos de "Sobre", "Cómo se hizo"
│  ├─ content.config.ts      # colecciones + esquemas Zod
│  ├─ data/
│  │  ├─ tablero.json        # datos de la encuesta (fuente única)
│  │  ├─ ficha-tecnica.ts    # 12 ítems de la ficha
│  │  └─ quiz.ts             # preguntas del quiz + parámetros de la fórmula
│  ├─ lib/
│  │  ├─ tablero.ts          # tipos + helpers: getTema, getIndicadores, destacados, cruces significativos
│  │  ├─ format.ts           # formato es-CO (2.008 · 4,9 · 27 %)
│  │  ├─ quiz.ts             # cálculo del puntaje (puro, testeable)
│  │  └─ seo.ts              # builders de JSON-LD
│  ├─ components/
│  │  ├─ layout/  Header.astro  NavDropdown.astro  Footer.astro  Seo.astro
│  │  ├─ ui/      StatCard.astro  TopicCard.astro  TopicTabs.astro  SectionTitle.astro  Button.astro
│  │  ├─ charts/  (Astro → SVG estático)
│  │  │   BarChart  StackedBar  Donut  SlopeChart (rondas)  DotPlot (grupos)
│  │  │   Waffle (100 personas)  ScaleMeter (escala con polos)  Thermometer  Heatmap
│  │  ├─ results/ FindingCard.astro  IndicatorChart.astro (elige gráfica según stat/familia)
│  │  └─ islands/ (React)
│  │      Quiz.tsx  QuestionModal.tsx  Tooltip.tsx  MobileMenu.tsx
│  ├─ layouts/  BaseLayout.astro  PageLayout.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ resultados/index.astro
│  │  ├─ resultados/[tema].astro      # getStaticPaths desde temas
│  │  ├─ como-se-hizo.astro
│  │  ├─ sobre-el-proyecto.astro
│  │  ├─ og/[tema].png.ts             # imagen social generada
│  │  └─ 404.astro
│  └─ styles/global.css     # @import "tailwindcss"; @theme { tokens }

```

### 5.1 Datos

`TABLERO` (extraído del HTML) tiene:
- `meta`: n total 2.008, n por ronda (2.008 / 1.492 / 1.175), diseño (deff, n efectivo), parámetros de significancia.
- `temas` (5): `polarizacion`, `populismo`, `desinformacion`, `ia`, `consumo`.
- `socio`: edad (4), sexo (2), estudios (3), estrato (3).
- `indicadores` (53): `stat` = `pct` (30) o `media` (23), `serie` (3 rondas con IC), `serie_panel`, `cruces` por variable socio con prueba, p, efecto y ajuste por controles, `destacado`, `familia`.

Reglas que se respetan del HTML (son de los investigadores):
- **Muestra no probabilística** → nunca decir "% de los colombianos" ni "promedio nacional"; usar "de las personas encuestadas". Sin margen de error.
- Solo se muestran diferencias entre grupos **significativas y que se mantienen con controles** (`significativo && aj.significativo`).
- No mostrar grupos con n < 30. Porcentajes sin decimales; medias con 1 decimal y coma.

Capa de mapeo (`src/lib/tablero.ts` + `content/temas/*.md`):

| Sección maqueta | slug URL | key en datos |
|---|---|---|
| Polarización | `polarizacion` | `polarizacion` |
| Populismo | `populismo` | `populismo` |
| Desinformación | `desinformacion` | `desinformacion` |
| Inteligencia artificial | `inteligencia-artificial` | `ia` |
| Consumo mediático | `consumo-mediatico` | `consumo` |
| Jóvenes | `jovenes` | **no existe** → ver §9 |

Así, si el JSON cambia de nombres internos, solo se toca el mapeo.

### 5.2 Gráfica según tipo de indicador

| Caso | Gráfica | Mensaje que comunica |
|---|---|---|
| `pct` simple | **Waffle 100 personas** + número gigante | "27 de cada 100" (lo más fácil de entender) |
| `media` en escala | **ScaleMeter** con polos en palabras | dónde cae el promedio entre dos extremos |
| familia de pct (ej. redes, medios) | **Barras horizontales** ordenadas | ranking |
| izquierda/centro/derecha | **Barra apilada** o donut | composición |
| termómetros de líderes (`th_*`) | **Thermometer** 0–10 | comparación de simpatía |
| cambio entre rondas | **SlopeChart** R1→R2→R3 | subió / bajó |
| cruces socio | **DotPlot** por grupo | quién se diferencia |
| Jóvenes | DotPlot "18–30 vs. resto" | brecha generacional |

Todas las gráficas: `<svg role="img">` + `<title>`/`<desc>` + tabla de datos oculta visualmente (`sr-only`) para lectores de pantalla y buscadores. Paleta y colores definidos en tokens; respetar `prefers-reduced-motion` en animaciones de entrada.

### 5.3 Quiz (`src/data/quiz.ts`)

Configurable, N ≥ 4 preguntas, escala 0–10:

```ts
export const quiz = {
  titulo: '¿Dónde te ubicas frente al resto del país?',
  preguntas: [
    {
      id: 'ideologia',
      texto: 'En política se habla de izquierda y derecha. ¿Dónde te ubicas?',
      min: 0, max: 10,
      etiquetas: ['Izquierda', 'Derecha'],
      invertir: false,          // si 10 = menos polarizado
      peso: 1,
      indicador: 'ie',          // opcional: liga a un indicador del tablero
    },
    // …
  ],
  // provisional: se reemplaza con la fórmula de los investigadores
  promedioReferencia: 4.9,
  etiquetasEspectro: ['Menos polarizado', 'Más polarizado'],
};
```

Fórmula **provisional** (en `src/lib/quiz.ts`, función pura + tests):
1. Normalizar cada respuesta a 0–10 (invertir si aplica; para ideología usar distancia al centro: `|x − 5| × 2`).
2. Puntaje = promedio ponderado.
3. Comparar con `promedioReferencia` → texto "Estás X puntos por encima/debajo del promedio de las personas encuestadas".

Nada se envía ni se guarda (todo en el navegador), como dice la maqueta.

---

## 6. Interactividad

1. **Menú desplegable** "Resultados": CSS `:hover`/`:focus-within` en escritorio; isla mínima o `<details>` en móvil.
2. **Quiz**: isla `client:visible` (el JS solo carga al llegar a la sección).
3. **Modal de pregunta**: isla `client:idle`. El contenido del modal ya está en el HTML (oculto en `<dialog>`) para SEO; React solo maneja apertura, foco y URL.
4. (Fase posterior) **Página por pregunta** `/resultados/[tema]/[pregunta]`: misma vista del modal como página indexable, útil para compartir un dato en redes.
5. **Tooltips** en gráficas: isla ligera o CSS puro.

---

## 7. SEO

- HTML estático completo en cada página (Astro SSG).
- `<Seo>` por página: `title` único (`Polarización | Pulso Democrático`), `meta description`, `canonical`, `og:*`, `twitter:card`, `og:image` generada por tema con el dato principal.
- `lang="es-CO"`, jerarquía h1→h2→h3 correcta, URLs en español sin acentos.
- JSON-LD: `WebSite` + `Organization` (global), `Dataset` (encuesta: creador, fechas, cobertura espacial Colombia, variables), `BreadcrumbList` en temas.
- `sitemap.xml` (`@astrojs/sitemap`), `robots.txt`.
- Datos de gráficas también como texto/tabla accesible (indexable).
- Core Web Vitals: imágenes con `astro:assets` (AVIF/WebP, `width/height`), fuentes autohospedadas con `font-display: swap` y preload, JS mínimo.
- Títulos con mayúscula inicial en cada palabra (requisito de la maqueta) → aplicado en contenido, no con CSS `capitalize` (para no romper preposiciones si se decide excepción).

---

## 8. Fases de trabajo

**Fase 0 — Setup (½ día)**
- Node 22 LTS, `pnpm create astro`, React, Tailwind v4, sitemap, ESLint/Prettier, `astro check`.
- Repo GitHub + Cloudflare Pages con previews por PR.

**Fase 1 — Datos (1 día)**
- Script `extract-tablero.ts` → `src/data/tablero.json`.
- Esquema Zod, tipos TS, helpers en `lib/tablero.ts`, formato es-CO.

**Fase 2 — Wireframe navegable (2–3 días)**
- Layout, Header/Nav/Footer, las 4 páginas + 6 temas con cajas grises (como la maqueta), responsive.
- Tokens provisionales (grises) listos para recibir colores de La Sabana.

**Fase 3 — Gráficas (3–4 días)**
- Componentes SVG de §5.2 con datos reales, accesibles.
- `IndicatorChart` que elige gráfica automáticamente.

**Fase 4 — Interactividad (2–3 días)**
- Quiz configurable + fórmula provisional.
- Modal de pregunta (series por ronda + cruces significativos + detalle técnico).

**Fase 5 — SEO y rendimiento (1–2 días)**
- `<Seo>`, JSON-LD, OG images, sitemap, Lighthouse CI.

**Fase 6 — Aplicar diseño final (cuando llegue el mockup)**
- Colores/logos/fotos/ilustraciones, tipografía, microanimaciones.
- Revisión de textos con investigadores, QA en móvil, accesibilidad (axe), publicación.

---

## 9. Pendientes y preguntas abiertas

**Del cliente / equipo de diseño (ya señalados en la maqueta):**
- [x] Códigos de color Universidad de La Sabana (ver §10).
- [x] Logos oficiales y fotos del equipo (ver §10).
- [ ] Foto 1 (hero) e ilustraciones vectoriales de los 6 temas.
- [x] Textos de "Sobre el proyecto" (¿Qué es?, ¿Por qué es importante?, equipo).
- [x] Número total de preguntas: "+100" (cliente).
- [ ] Ponderación (ficha técnica: "no aparece en el documento de métodos"; el HTML dice que se pondera por sexo, edad, educación y región según DANE — confirmar).
- [x] Enlace oficial de CNEP: archivo de datos en upf.edu (ver `cnep.url`).

**Detectados al revisar los datos:**
- [ ] **Jóvenes**: es una sección de la maqueta pero no es un tema en los datos. Propuesta: construirla con los cruces por edad (18–30 vs. resto, solo diferencias significativas), como hace el HTML. Alternativa: que el equipo envíe indicadores específicos.
- [ ] **Mapa "por municipio"** (tarjeta 04 de la diapositiva de Resultados): los datos no tienen cruces por municipio ni por región. La maqueta dice que esos gráficos "son solo ejemplos de formato", así que se omite salvo que lleguen datos por región.
- [ ] **"Promedio nacional"** en el quiz: por ser muestra no probabilística, usar "promedio de las personas encuestadas" (la propia maqueta ya lo dice así en el texto del resultado).
- [ ] **Preguntas reales del quiz** y su fórmula (por ahora provisional, ver §5.3).
- [ ] "Consumo mediático" en la maqueta vs "Cómo se informan" en los datos: confirmar nombre final.
- [ ] Pendiente del HTML antes de publicar: fechas exactas de campo por ola, empresa de campo, proveedor del panel (Netquest según maqueta), criterios de inclusión, entidad responsable.
- [ ] Dominio final (necesario para `site` en Astro, canonical y sitemap).

---

## 10. Cambios tras especificaciones del cliente (2026-10-15)

Fuente: `docs/Especificaciones y transcripción texto.docx` (textos de todo el sitio; las notas en naranja son para diseño).

- **Colores**: Guía de marca U. de La Sabana en `src/styles/global.css` (`@theme`): 281 `#00205B` (marca, títulos), 286 `#00387D` (acento/interacción y dato principal en gráficas), 292 `#93AAC9` (solo rellenos, nunca texto: 2,4:1), 2707 `#D9E1EF` (superficies), 7499 `#F7EFD9` (resaltado), Pantone Black C `#2D2926` y sus tintas (bordes; texto secundario en Black 80 % `#575451` para cumplir AA también sobre 2707). Tokens semánticos `brand`, `accent`, `surface-*`, `ink*`, `focus` y `chart-*`.
- **Ficha técnica**: exactamente las 8 cajas del documento (`src/data/ficha-tecnica.ts`). "Realizado por" conserva el texto del cliente (menciona Universitat Pompeu Fabra). Panel: nota, fecha de aplicación y "N participantes · N preguntas" (190 / 160 / 170) + "1.081 personas respondieron las tres rondas".
- **Cifras**: "+100 preguntas" es dato del cliente (`PREGUNTAS_CUESTIONARIO` en `sitio.ts`), no los 53 indicadores del JSON. "4 regiones del país".
- **Instituciones** (footer, "Una iniciativa de" y pie de gráficas en detalle), en este orden: CNEP, Universidad de Wisconsin, Universidad de La Sabana, Universidad Externado de Colombia. Logos en `src/assets/logos/*.webp` (`instituciones[].logo`).
- **Equipo**: 8 personas en el orden del documento (`src/data/equipo.ts`); fotos en `src/assets/equipo/<slug>.webp` optimizadas con `astro:assets` (avif/webp); tarjeta + `<dialog>` nativo con el perfil; correos armados en el navegador (protección leve contra recolectores).
- **Títulos**: mayúscula inicial en cada palabra salvo palabras menores (de, la, el, y, en, del, a, por, para, con, sobre, los, las, se, que…), con `titulo()` de `src/lib/format.ts`. Se aplica a h1/h2, menú y nombres de tema; el texto corrido va en minúscula normal.
- **Quiz**: siempre "promedio de los encuestados" (nunca "promedio nacional"). La comparación pregunta por pregunta la resuelve la Fase 4.
- **Gráficas**: Óscar Londoño entrega los datos (no imágenes); las gráficas siguen siendo SVG propios.
- **Pendientes**: foto del hero (la resuelve Valentina al final) e ilustraciones de los 6 temas.
```
