# Pulso Democrático

Sitio web con los resultados de la encuesta panel **CNEP Colombia 2026**. El plan completo del proyecto está en [PLAN.md](./PLAN.md).

## Requisitos

- Node.js 22 (`>=22.12`, ver `.nvmrc`)
- pnpm 10

## Comandos

| Comando        | Acción                                     |
| -------------- | ------------------------------------------ |
| `pnpm install` | Instala dependencias                       |
| `pnpm dev`     | Servidor de desarrollo en `localhost:4321` |
| `pnpm build`   | Genera el sitio estático en `dist/`        |
| `pnpm preview` | Sirve localmente el build                  |
| `pnpm check`   | Verificación de tipos (`astro check`)      |
| `pnpm lint`    | ESLint                                     |
| `pnpm format`  | Prettier                                   |

## Despliegue

GitHub Pages (actual): el workflow [`deploy.yml`](.github/workflows/deploy.yml) compila en cada
push a `main` y publica `dist/` en la rama `gh-pages`. El sitio queda en
`https://<owner>.github.io/<repo>/`, así que el build recibe `BASE_PATH=/<repo>`; los enlaces
internos deben pasar por `ruta()` (`src/lib/rutas.ts`).

- Configuración única: Settings → Pages → Source: _Deploy from a branch_ → `gh-pages` / `(root)`.
- Con dominio propio: quitar `BASE_PATH` del workflow y poner el dominio en `SITE_URL`.

Cloudflare Pages (alternativa):

- Comando de build: `pnpm build`
- Directorio de salida: `dist`
- Variable de entorno: `NODE_VERSION=22`

## Pendientes

- **URL propia por tema en `/resultados` (SEO).** Hoy los temas de «Resultados de la encuesta»
  son pestañas dentro de `/resultados` (`#polarizacion`, etc.). Google no indexa el `#` como
  página aparte (las páginas `/resultados/<tema>` se quitaron; el menú y el inicio enlazan
  a `/resultados#<tema>`). Si algún día se quiere posicionar cada tema: que el selector
  enlace a `/resultados/<tema>` (mismo diseño, el tema marcado) con precarga y View Transitions
  de Astro, y que `/resultados` muestre solo los principales y el selector. Así cada tema tiene
  título, descripción y vista previa propios y las páginas pesan menos.
