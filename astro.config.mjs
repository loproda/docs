// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import tailwindcss from '@tailwindcss/vite';
import { readdir } from "fs/promises";

async function autoGenStyles() {
	const styles = (
		await readdir("./src/styles/", {
			withFileTypes: true,
			recursive: true,
		})
	)
		.filter((x) => x.isFile())
		.map((x) => x.parentPath + x.name)
		.sort((a) => (a === "./src/styles/tailwind.css" ? -1 : 1));

	return styles;
}

const customCss = await autoGenStyles();

export default defineConfig({
    site: "https://docs.loproda.com",
	experimental: {
		contentIntellisense: true,
	},
    i18n: {
        defaultLocale: "es",
        locales: ["es"]
    },
    integrations: [
        starlight({
            title: 'Loproda Docs',
            social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/loproda/docs' }],
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
            customCss,
            credits: false,
            pagination: false,
            lastUpdated: true,
            markdown: {
				headingLinks: false,
			},
        }),
	],
    vite: {
        plugins: [tailwindcss()],
    },
});