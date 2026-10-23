// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO: reemplazar por el dominio final (ver PLAN.md §9). Afecta canonical y sitemap.
  // En GitHub Pages el workflow define SITE_URL y BASE_PATH (el sitio vive en /<repo>);
  // los enlaces internos usan `ruta()` (src/lib/rutas.ts) para respetar el base.
  site: process.env.SITE_URL ?? 'https://pulsodemocratico.co',
  base: process.env.BASE_PATH ?? '/',
  output: 'static',
  integrations: [react(), sitemap(), icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});
