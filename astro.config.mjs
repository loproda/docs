// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
      starlight({
          title: 'Loproda Docs',
          social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
          sidebar: [
              {
                  label: 'Guides',
                  items: [
                      { label: 'Example Guide', slug: 'guides/example' },
                  ],
              },
              {
                  label: 'Reference',
                  autogenerate: { directory: 'reference' },
              },
          ],
          logo: {
              src: "./src/assets/logo.png",
          },
          customCss: [
            './src/styles/global.css',
          ],
          credits: false,
      }),
	],

  vite: {
    plugins: [tailwindcss()],
  },
});