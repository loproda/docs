// @ts-nocheck
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import tailwindcss from '@tailwindcss/vite';
import { readdir } from "fs/promises";

import rehypeTitleFigure from "rehype-title-figure";
import rehypeMermaid from "./src/plugins/rehype/mermaid.ts";
import rehypeAutolinkHeadings from "./src/plugins/rehype/autolink-headings.ts";
import rehypeExternalLinks from "./src/plugins/rehype/external-links.ts";
import rehypeHeadingSlugs from "./src/plugins/rehype/heading-slugs.ts";
import rehypeShiftHeadings from "./src/plugins/rehype/shift-headings.ts";

import react from "@astrojs/react";

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
    markdown: {
        smartypants: false,
        rehypePlugins: [
            rehypeMermaid,
            rehypeExternalLinks,
            rehypeHeadingSlugs,
            rehypeAutolinkHeadings,
            // @ts-expect-error plugins types are outdated but functional
            rehypeTitleFigure,
            rehypeShiftHeadings,
        ],
    },
    integrations: [starlight({
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
        components: {
		    Banner: "./src/components/overrides/Banner.astro",
            Footer: "./src/components/overrides/Footer.astro",
			Header: "./src/components/overrides/Header.astro",
            /*
			Head: "./src/components/overrides/Head.astro",
			Hero: "./src/components/overrides/Hero.astro",
			MarkdownContent: "./src/components/overrides/MarkdownContent.astro",
			Sidebar: "./src/components/overrides/Sidebar.astro",
			PageTitle: "./src/components/overrides/PageTitle.astro",
			TableOfContents: "./src/components/overrides/TableOfContents.astro",
            */
        },
        customCss,
        credits: false,
        pagination: false,
        lastUpdated: true,
        markdown: {
            headingLinks: false,
        },
    }), react()],
    vite: {
        plugins: [tailwindcss()],
    },
});