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

Cloudflare Pages:

- Comando de build: `pnpm build`
- Directorio de salida: `dist`
- Variable de entorno: `NODE_VERSION=22`
